import YAML from "yaml";
import type { SpecificationChange, SpecificationComparisonResult } from "../../domain/compare/SpecificationComparisonResult";

type Document = Record<string, any>;
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

export class SpecificationComparisonService {
  public compare(oldContent: string, newContent: string): SpecificationComparisonResult {
    const oldDocument = this.parse(oldContent);
    const newDocument = this.parse(newContent);
    const changes: SpecificationChange[] = [];

    const oldPaths = oldDocument.paths ?? {};
    const newPaths = newDocument.paths ?? {};
    for (const path of Object.keys(oldPaths)) {
      if (!(path in newPaths)) {
        changes.push({ type: "REMOVED", category: "PATH", location: path, breaking: true, message: `Path '${path}' was removed` });
        continue;
      }
      this.compareMethods(path, oldPaths[path], newPaths[path], changes);
    }
    for (const path of Object.keys(newPaths)) {
      if (!(path in oldPaths)) changes.push({ type: "ADDED", category: "PATH", location: path, breaking: false, message: `Path '${path}' was added` });
    }

    const oldSchemas = this.schemas(oldDocument);
    const newSchemas = this.schemas(newDocument);
    for (const name of Object.keys(oldSchemas)) {
      if (!(name in newSchemas)) {
        changes.push({ type: "REMOVED", category: "SCHEMA", location: name, breaking: true, message: `Schema '${name}' was removed` });
      } else if (this.stable(oldSchemas[name]) !== this.stable(newSchemas[name])) {
        changes.push({ type: "CHANGED", category: "SCHEMA", location: name, breaking: this.isBreakingSchemaChange(oldSchemas[name], newSchemas[name]), message: `Schema '${name}' changed` });
      }
    }
    for (const name of Object.keys(newSchemas)) {
      if (!(name in oldSchemas)) changes.push({ type: "ADDED", category: "SCHEMA", location: name, breaking: false, message: `Schema '${name}' was added` });
    }

    const breaking = changes.filter((change) => change.breaking).length;
    const totalBaseline = Math.max(1, Object.keys(oldPaths).length + Object.keys(oldSchemas).length);
    return {
      compatible: breaking === 0,
      compatibilityScore: Math.max(0, Math.round((1 - breaking / totalBaseline) * 100)),
      summary: {
        added: changes.filter((change) => change.type === "ADDED").length,
        removed: changes.filter((change) => change.type === "REMOVED").length,
        changed: changes.filter((change) => change.type === "CHANGED").length,
        breaking,
      },
      changes,
    };
  }

  private compareMethods(path: string, oldPath: Document, newPath: Document, changes: SpecificationChange[]): void {
    const oldMethods = Object.keys(oldPath ?? {}).filter((key) => HTTP_METHODS.has(key.toLowerCase()));
    const newMethods = Object.keys(newPath ?? {}).filter((key) => HTTP_METHODS.has(key.toLowerCase()));
    for (const method of oldMethods) {
      if (!newMethods.includes(method)) changes.push({ type: "REMOVED", category: "METHOD", location: `${method.toUpperCase()} ${path}`, breaking: true, message: `Method '${method.toUpperCase()}' was removed from '${path}'` });
      else if (this.stable(oldPath[method]) !== this.stable(newPath[method])) changes.push({ type: "CHANGED", category: "METHOD", location: `${method.toUpperCase()} ${path}`, breaking: false, message: `Operation '${method.toUpperCase()} ${path}' changed` });
    }
    for (const method of newMethods) {
      if (!oldMethods.includes(method)) changes.push({ type: "ADDED", category: "METHOD", location: `${method.toUpperCase()} ${path}`, breaking: false, message: `Method '${method.toUpperCase()}' was added to '${path}'` });
    }
  }

  private parse(content: string): Document {
    const parsed = YAML.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid Swagger/OpenAPI document");
    return parsed;
  }
  private schemas(document: Document): Document { return document.components?.schemas ?? document.definitions ?? {}; }
  private stable(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map((item) => this.stable(item)).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value as Document).sort().map((key) => `${JSON.stringify(key)}:${this.stable((value as Document)[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  private isBreakingSchemaChange(oldSchema: Document, newSchema: Document): boolean {
    const oldRequired = new Set<string>(oldSchema.required ?? []);
    const newRequired = new Set<string>(newSchema.required ?? []);
    for (const field of newRequired) if (!oldRequired.has(field)) return true;
    const oldProperties = oldSchema.properties ?? {};
    const newProperties = newSchema.properties ?? {};
    return Object.keys(oldProperties).some((field) => !(field in newProperties));
  }
}
