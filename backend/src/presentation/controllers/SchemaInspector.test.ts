import { describe, expect, it } from "vitest";

type Row = { path: string; sourcePointer: string; type: string; required: boolean; branch: string; note: string; constraints: { keyword: string; value: string }[] };
const { inspectSchema, resolveNode } = require("../../../public/schema-inspector.js") as {
  inspectSchema: (document: object, schema: unknown, options?: object) => { rows: Row[]; truncated: boolean };
  resolveNode: (document: object, value: unknown) => { value: any; note?: string };
};

describe("YAML schema field inspection", () => {
  it("shows enum, regex and required fields through local references", () => {
    const document = { components: { schemas: { Status: { type: "string", enum: ["ACTIVE", "BLOCKED"], pattern: "^[A-Z]+$", minLength: 2, maxLength: 20 } } } };
    const result = inspectSchema(document, { type: "object", required: ["status"], properties: { status: { $ref: "#/components/schemas/Status" } } });
    const field = result.rows.find((row) => row.path === "status")!;
    expect(field.type).toBe("string");
    expect(field.required).toBe(true);
    expect(field.constraints).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: "enum", value: '"ACTIVE" · "BLOCKED"' }),
      expect.objectContaining({ keyword: "pattern", value: "^[A-Z]+$" }),
      expect.objectContaining({ keyword: "maxLength", value: "20" }),
    ]));
  });
  it("links referenced fields to the target definition rather than another field of the same name", () => {
    const id = { type: "string", pattern: "^A" };
    const schema = { properties: { id } };
    const document = { definitions: { Account: schema } };
    const pointers = new WeakMap<object, string>([[schema, "/definitions/Account"], [id, "/definitions/Account/properties/id"]]);
    const result = inspectSchema(document, { $ref: "#/definitions/Account" }, { nodePointer: (node: object) => pointers.get(node) });
    expect(result.rows.find((row) => row.path === "id")?.sourcePointer).toBe("/definitions/Account/properties/id");
  });
  it("keeps false, zero and nullable enum values", () => {
    const result = inspectSchema({}, { type: ["integer", "null"], minimum: 0, maximum: 10, default: 0, example: false, nullable: false, enum: [0, false, null] });
    expect(result.rows[0].constraints).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: "minimum", value: "0" }),
      expect.objectContaining({ keyword: "example", value: "false" }),
      expect.objectContaining({ keyword: "nullable", value: "false" }),
      expect.objectContaining({ keyword: "enum", value: "0 · false · null" }),
    ]));
  });
  it("walks arrays, nested fields and additional properties", () => {
    const result = inspectSchema({}, { type: "object", properties: { entries: { type: "array", minItems: 1, items: { type: "object", required: ["id"], properties: { id: { type: "integer", minimum: 0 } }, additionalProperties: { type: "string", pattern: "^x" } } } } });
    expect(result.rows.find((row) => row.path === "entries[].id")?.required).toBe(true);
    expect(result.rows.find((row) => row.path === "entries[].*")?.constraints).toContainEqual(expect.objectContaining({ keyword: "pattern", value: "^x" }));
  });
  it("retains alternative branches and combines allOf required declarations", () => {
    const result = inspectSchema({}, { allOf: [{ required: ["id"] }, { properties: { id: { type: "string" }, choice: { oneOf: [{ enum: ["A"] }, { enum: ["B"] }] } } }] });
    expect(result.rows.find((row) => row.path === "id")?.required).toBe(true);
    const choices = result.rows.filter((row) => row.path === "choice" && row.constraints.some((constraint) => constraint.keyword === "enum"));
    expect(choices).toHaveLength(2);
    expect(choices[0].branch).toContain("oneOf 1");
    expect(choices[1].branch).toContain("oneOf 2");
  });
  it("stops recursive references and still inspects independent uses", () => {
    const document = { definitions: { Node: { type: "object", properties: { name: { type: "string", maxLength: 12 }, next: { $ref: "#/definitions/Node" } } } } };
    const result = inspectSchema(document, { properties: { left: { $ref: "#/definitions/Node" }, right: { $ref: "#/definitions/Node" } } });
    expect(result.rows.find((row) => row.path === "left.next")?.note).toContain("Recursive");
    expect(result.rows.find((row) => row.path === "right.name")?.type).toBe("string");
    expect(result.rows.length).toBeLessThan(20);
  });
  it("decodes JSON pointer names and reports missing or external references", () => {
    const document = { definitions: { "A/B~C": { type: "string", pattern: "^[0-9]+$" } } };
    expect(inspectSchema(document, { $ref: "#/definitions/A~1B~0C" }).rows[0].type).toBe("string");
    expect(inspectSchema(document, { $ref: "#/missing" }).rows[0].note).toContain("Unresolved");
    expect(inspectSchema(document, { $ref: "other.yaml#/Schema" }).rows[0].note).toContain("External");
  });
  it("resolves reusable request and response metadata without losing content", () => {
    const document = { components: { responses: { Ok: { description: "Original", content: { "application/json": { schema: { type: "string" } } } } } } };
    const response = resolveNode(document, { $ref: "#/components/responses/Ok", description: "Updated" });
    expect(response.value.description).toBe("Updated");
    expect(response.value.content["application/json"].schema.type).toBe("string");
  });
  it("limits rendering for extremely large schemas", () => {
    const result = inspectSchema({}, { properties: Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`field${index}`, { type: "string" }])) }, { limit: 10 });
    expect(result.rows).toHaveLength(10);
    expect(result.truncated).toBe(true);
  });
});
