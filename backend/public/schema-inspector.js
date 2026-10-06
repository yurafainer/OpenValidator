/* Shared schema inspection logic. Local references are read without changing the source. */
(function (root) {
  function resolveNode(document, value, references = new Set(), schemaMode = false) {
    if (!value || typeof value !== "object" || !value.$ref) return { value, references };
    const reference = value.$ref;
    if (typeof reference !== "string" || !reference.startsWith("#/")) return { value, references, note: `External reference: ${reference}` };
    if (references.has(reference)) return { value, references, note: `Recursive reference: ${reference}` };
    const next = new Set(references);
    next.add(reference);
    let target = document;
    try {
      for (const encoded of reference.slice(2).split("/")) {
        const part = decodeURIComponent(encoded).replace(/~1/g, "/").replace(/~0/g, "~");
        if (!target || typeof target !== "object" || !Object.prototype.hasOwnProperty.call(target, part)) return { value, references: next, note: `Unresolved reference: ${reference}` };
        target = target[part];
      }
    } catch {
      return { value, references: next, note: `Unresolved reference: ${reference}` };
    }
    const result = resolveNode(document, target, next, schemaMode);
    // Keep siblings as a separate schema to avoid overriding constraints on the referenced schema.
    const siblings = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$ref"));
    if (Object.keys(siblings).length && result.value && typeof result.value === "object") {
      return { ...result, value: schemaMode ? { allOf: [result.value, siblings] } : { ...result.value, ...siblings } };
    }
    return result;
  }

  function valueText(value) { return typeof value === "string" ? value : JSON.stringify(value); }

  function constraints(schema) {
    const result = [];
    const add = (label, key) => { if (schema[key] !== undefined) result.push({ label, value: valueText(schema[key]), keyword: key }); };
    if (Array.isArray(schema.enum)) result.push({ label: "Allowed values (enum)", value: schema.enum.map((value) => JSON.stringify(value)).join(" · "), keyword: "enum" });
    add("Fixed value (const)", "const");
    add("Regex (pattern)", "pattern");
    add("Format", "format");
    add("Min length", "minLength"); add("Max length", "maxLength");
    add("Minimum", "minimum"); add("Maximum", "maximum");
    add("Exclusive minimum", "exclusiveMinimum"); add("Exclusive maximum", "exclusiveMaximum");
    add("Multiple of", "multipleOf");
    add("Min items", "minItems"); add("Max items", "maxItems"); add("Unique items", "uniqueItems");
    add("Min properties", "minProperties"); add("Max properties", "maxProperties");
    add("Nullable", "nullable"); add("Read only", "readOnly"); add("Write only", "writeOnly"); add("Deprecated", "deprecated");
    add("Default", "default"); add("Example", "example"); add("Examples", "examples");
    add("Encoding", "contentEncoding"); add("Media type", "contentMediaType");
    if (typeof schema.additionalProperties === "boolean") add("Additional properties", "additionalProperties");
    if (Array.isArray(schema.required) && schema.required.length) add("Required properties", "required");
    if (schema.discriminator !== undefined) add("Discriminator", "discriminator");
    return result;
  }

  function schemaType(schema) {
    if (typeof schema === "boolean") return schema ? "any" : "never";
    if (schema.type) return Array.isArray(schema.type) ? schema.type.join(" | ") : schema.type;
    if (schema.properties || schema.additionalProperties) return "object";
    if (schema.items || schema.prefixItems) return "array";
    if (schema.allOf) return "allOf";
    if (schema.oneOf) return "oneOf";
    if (schema.anyOf) return "anyOf";
    return "unspecified";
  }

  function inspectSchema(document, schema, options = {}) {
    const rows = [];
    const limit = options.limit || 2000;
    function requiredNames(raw, references = new Set(), depth = 0) {
      if (depth >= 24) return [];
      const resolved = resolveNode(document, raw, references, true);
      if (resolved.note || !resolved.value || typeof resolved.value !== "object") return [];
      return [...(Array.isArray(resolved.value.required) ? resolved.value.required : []),
        ...(resolved.value.allOf || []).flatMap((child) => requiredNames(child, resolved.references, depth + 1))];
    }
    function walk(raw, path, required, branch, references, depth, inheritedRequired = []) {
      if (rows.length >= limit) return;
      const resolved = resolveNode(document, raw, references, true);
      const node = resolved.value;
      if (node === undefined || node === null) return;
      const row = { path, required, branch, type: schemaType(node), constraints: typeof node === "object" ? constraints(node) : [], description: node.description || "", reference: raw?.$ref || "", note: resolved.note || "", sourcePointer: options.nodePointer?.(node) || options.nodePointer?.(raw) || options.pointer || "" };
      rows.push(row);
      if (row.note || typeof node !== "object") return;
      if (depth >= 24) { row.note = "Expand the source for deeper fields (display depth limit)."; return; }
      const requiredFields = new Set([...requiredNames(node), ...inheritedRequired]);
      for (const [name, child] of Object.entries(node.properties || {})) walk(child, path === "$" ? name : `${path}.${name}`, requiredFields.has(name), branch, resolved.references, depth + 1);
      if (node.items !== undefined) {
        if (Array.isArray(node.items)) node.items.forEach((child, index) => walk(child, `${path}[${index}]`, false, branch, resolved.references, depth + 1));
        else walk(node.items, `${path}[]`, false, branch, resolved.references, depth + 1);
      }
      if (Array.isArray(node.prefixItems)) node.prefixItems.forEach((child, index) => walk(child, `${path}[${index}]`, false, branch, resolved.references, depth + 1));
      if (node.additionalProperties && typeof node.additionalProperties === "object") walk(node.additionalProperties, `${path}.*`, false, branch, resolved.references, depth + 1);
      for (const [pattern, child] of Object.entries(node.patternProperties || {})) walk(child, `${path}[${pattern}]`, false, `${branch ? `${branch} / ` : ""}patternProperties`, resolved.references, depth + 1);
      for (const keyword of ["allOf", "oneOf", "anyOf"]) {
        if (Array.isArray(node[keyword])) node[keyword].forEach((child, index) => walk(child, path, required, `${branch ? `${branch} / ` : ""}${keyword} ${index + 1}`, resolved.references, depth + 1, [...requiredFields]));
      }
      for (const keyword of ["not", "if", "then", "else", "contains", "propertyNames"]) {
        if (node[keyword] !== undefined) walk(node[keyword], path, required, `${branch ? `${branch} / ` : ""}${keyword}`, resolved.references, depth + 1);
      }
    }
    walk(schema, options.path || "$", Boolean(options.required), "", new Set(), 0);
    return { rows, truncated: rows.length >= limit };
  }

  const api = { resolveNode, inspectSchema, valueText };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.YamlSchemaInspector = api;
})(globalThis);
