import { describe, expect, it } from "vitest";
import { SpecificationComparisonService } from "./SpecificationComparisonService";
const service = new SpecificationComparisonService();
describe("SpecificationComparisonService", () => {
  it("detects removed operations as breaking", () => {
    const result = service.compare("openapi: 3.0.0\npaths:\n  /accounts:\n    get: {}", "openapi: 3.0.0\npaths:\n  /accounts: {}");
    expect(result.compatible).toBe(false);
    expect(result.changes).toEqual(expect.arrayContaining([expect.objectContaining({ category: "METHOD", type: "REMOVED", breaking: true })]));
  });
  it("detects added paths as compatible", () => {
    const result = service.compare("openapi: 3.0.0\npaths: {}", "openapi: 3.0.0\npaths:\n  /accounts:\n    get: {}");
    expect(result.compatible).toBe(true);
    expect(result.summary.added).toBe(1);
  });
  it("detects newly required schema fields as breaking", () => {
    const oldSpec = "openapi: 3.0.0\npaths: {}\ncomponents:\n  schemas:\n    Person:\n      type: object\n      properties:\n        name: { type: string }";
    const newSpec = oldSpec + "\n      required: [name]";
    expect(service.compare(oldSpec, newSpec).summary.breaking).toBe(1);
  });
});
