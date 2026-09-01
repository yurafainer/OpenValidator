import { XMLParser, XMLValidator } from "fast-xml-parser";
import { injectable } from "tsyringe";

import type { XsdField, XsdFieldExtractionResult } from "../../domain/xsd/XsdField";

type XmlNode = Record<string, unknown>;

@injectable()
export class XsdFieldExtractionService {
  private readonly parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });

  extract(xsd: string, fileName = "schema.xsd"): XsdFieldExtractionResult {
    const validation = XMLValidator.validate(xsd);
    if (validation !== true) {
      throw new Error(`Invalid XSD: ${validation.err.msg} (line ${validation.err.line})`);
    }

    const document = this.parser.parse(xsd) as XmlNode[];
    const schema = document.find((node) => this.nodeEntry(node, "schema"));
    const schemaEntry = schema && this.nodeEntry(schema, "schema");
    if (!schemaEntry || !Array.isArray(schemaEntry.value)) {
      throw new Error("Invalid XSD: an XML Schema root element was not found");
    }

    const schemaChildren = schemaEntry.value as XmlNode[];
    const namedTypes = new Map<string, XmlNode>();
    for (const node of schemaChildren) {
      const typeEntry = this.nodeEntry(node, "complexType") ?? this.nodeEntry(node, "simpleType");
      const name = this.attributes(node).name;
      if (typeEntry && name) namedTypes.set(name, node);
    }

    const fields: XsdField[] = [];
    for (const node of schemaChildren) {
      if (this.nodeEntry(node, "element")) {
        this.visitElement(node, [], fields, namedTypes);
      }
    }

    return { fileName, fieldCount: fields.length, fields };
  }

  private visitElement(
    node: XmlNode,
    parentPath: string[],
    fields: XsdField[],
    namedTypes: Map<string, XmlNode>,
  ): void {
    const elementEntry = this.nodeEntry(node, "element");
    if (!elementEntry || !Array.isArray(elementEntry.value)) return;

    const attributes = this.attributes(node);
    const reference = attributes.ref;
    const name = attributes.name ?? this.localName(reference ?? "");
    if (!name) return;

    const content = elementEntry.value as XmlNode[];
    const inlineComplexType = content.find((child) => this.nodeEntry(child, "complexType"));
    const inlineSimpleType = content.find((child) => this.nodeEntry(child, "simpleType"));
    const restriction = inlineSimpleType && this.findFirst(inlineSimpleType, "restriction");
    const restrictionAttributes = restriction ? this.attributes(restriction) : {};
    const explicitType = attributes.type ? this.localName(attributes.type) : undefined;
    const resolvedType = explicitType ? namedTypes.get(explicitType) : undefined;
    const complexType = inlineComplexType ?? (resolvedType && this.nodeEntry(resolvedType, "complexType") ? resolvedType : undefined);
    const childElements = complexType ? this.immediateElements(complexType) : [];
    const path = [...parentPath, name];
    const maxOccurs = attributes.maxOccurs ?? "1";
    const minOccurs = attributes.minOccurs ?? "1";
    const allowedValues = this.findScopedAll(content, "enumeration")
      .map((item) => this.attributes(item).value)
      .filter((value): value is string => value !== undefined);
    const transparentRepeatedWrapper = parentPath.length > 0
      && maxOccurs === "unbounded"
      && childElements.length === 1
      && this.attributes(childElements[0]).maxOccurs === "unbounded";

    if (!transparentRepeatedWrapper) {
      fields.push({
        name,
        type: reference
          ? `ref:${this.localName(reference)}`
          : maxOccurs === "unbounded"
            ? "unbounded"
            : explicitType
              ?? (inlineComplexType ? "complexType" : undefined)
              ?? (restrictionAttributes.base ? this.localName(restrictionAttributes.base) : "string"),
        length: this.readLength(content),
        path: path.join("."),
        depth: parentPath.length,
        minOccurs,
        maxOccurs,
        required: minOccurs !== "0",
        nillable: attributes.nillable === "true" || attributes.nillable === "1",
        description: this.readDescription(content),
        allowedValues: allowedValues.length ? allowedValues : undefined,
      });
    }

    if (!complexType) return;

    for (const child of childElements) {
      this.visitElement(child, transparentRepeatedWrapper ? parentPath : path, fields, namedTypes);
    }
  }

  private immediateElements(node: XmlNode): XmlNode[] {
    const results: XmlNode[] = [];
    const visit = (nodes: XmlNode[]): void => {
      for (const child of nodes) {
        const entry = Object.entries(child).find(([key]) => key !== ":@" && key !== "#text");
        if (!entry || !Array.isArray(entry[1])) continue;
        if (this.localName(entry[0]) === "element") {
          results.push(child);
          continue;
        }
        visit(entry[1] as XmlNode[]);
      }
    };

    const entry = Object.entries(node).find(([key]) => key !== ":@" && key !== "#text");
    if (entry && Array.isArray(entry[1])) visit(entry[1] as XmlNode[]);
    return results;
  }

  private readLength(content: XmlNode[]): number | undefined {
    const fieldInfo = this.findScopedFirst(content, "FieldInfo");
    const fieldLength = fieldInfo && this.attributes(fieldInfo).Length;
    if (fieldLength !== undefined) return this.numberValue(fieldLength);

    for (const facet of ["length", "maxLength", "totalDigits"]) {
      const node = this.findScopedFirst(content, facet);
      const value = node && this.attributes(node).value;
      if (value !== undefined) return this.numberValue(value);
    }
    return undefined;
  }

  private readDescription(content: XmlNode[]): string | undefined {
    const documentation = this.findScopedFirst(content, "documentation");
    if (!documentation) return undefined;
    const entry = this.nodeEntry(documentation, "documentation");
    if (!entry || !Array.isArray(entry.value)) return undefined;
    const text = (entry.value as XmlNode[])
      .map((item) => typeof item["#text"] === "string" ? item["#text"] : "")
      .join(" ")
      .trim();
    return text || undefined;
  }

  private findFirst(node: XmlNode | XmlNode[], wantedName: string): XmlNode | undefined {
    return this.findAll(node, wantedName)[0];
  }

  private findScopedFirst(node: XmlNode | XmlNode[], wantedName: string): XmlNode | undefined {
    return this.findScopedAll(node, wantedName)[0];
  }

  private findScopedAll(node: XmlNode | XmlNode[], wantedName: string): XmlNode[] {
    const results: XmlNode[] = [];
    const nodes = Array.isArray(node) ? node : [node];
    for (const item of nodes) {
      for (const [key, value] of Object.entries(item)) {
        if (key === ":@" || key === "#text") continue;
        const localName = this.localName(key);
        if (localName === wantedName) results.push(item);
        if (localName !== "element" && Array.isArray(value)) {
          results.push(...this.findScopedAll(value as XmlNode[], wantedName));
        }
      }
    }
    return results;
  }

  private findAll(node: XmlNode | XmlNode[], wantedName: string): XmlNode[] {
    const results: XmlNode[] = [];
    const nodes = Array.isArray(node) ? node : [node];
    for (const item of nodes) {
      for (const [key, value] of Object.entries(item)) {
        if (key === ":@" || key === "#text") continue;
        if (this.localName(key) === wantedName) results.push(item);
        if (Array.isArray(value)) results.push(...this.findAll(value as XmlNode[], wantedName));
      }
    }
    return results;
  }

  private nodeEntry(node: XmlNode, wantedName: string): { key: string; value: unknown } | undefined {
    const entry = Object.entries(node).find(([key]) => this.localName(key) === wantedName);
    return entry ? { key: entry[0], value: entry[1] } : undefined;
  }

  private attributes(node: XmlNode): Record<string, string> {
    return (node[":@"] ?? {}) as Record<string, string>;
  }

  private localName(name: string): string {
    return name.split(":").pop() ?? name;
  }

  private numberValue(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
