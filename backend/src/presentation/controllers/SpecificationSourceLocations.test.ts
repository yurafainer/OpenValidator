import { describe, expect, it } from "vitest";
import { specificationSourceLocations } from "./SpecificationSourceLocations";

describe("Specification source line index", () => {
  it("distinguishes fields with the same name in different schemas", () => {
    const source = '# comment\ndefinitions:\n  First:\n    properties:\n      id:\n        type: string\n  Second:\n    properties:\n      id:\n        type: integer\n';
    const lines = specificationSourceLocations(source);
    expect(lines["/definitions/First/properties/id"]).toBe(5);
    expect(lines["/definitions/Second/properties/id"]).toBe(9);
  });
  it("indexes arrays and escaped JSON pointer keys", () => {
    const lines = specificationSourceLocations('paths:\n  /a~b:\n    parameters:\n      - name: id\n        schema:\n          type: string\n');
    expect(lines["/paths/~1a~0b/parameters/0/schema"]).toBe(5);
  });
  it("indexes JSON and CRLF documents", () => {
    expect(specificationSourceLocations('{\r\n  "properties": {\r\n    "id": { "type": "string" }\r\n  }\r\n}')["/properties/id"]).toBe(3);
  });
});
