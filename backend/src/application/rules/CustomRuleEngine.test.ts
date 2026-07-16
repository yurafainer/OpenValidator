import { describe, expect, it } from "vitest";
import { CustomRuleEngine } from "./CustomRuleEngine";
const engine = new CustomRuleEngine();
describe("CustomRuleEngine", () => {
  it("validates UUID fields", () => expect(engine.validate([{ location: "headers.x-request-id", format: "uuid" }], { headers: { "x-request-id": "550e8400-e29b-41d4-a716-446655440000" } })).toHaveLength(0));
  it("reports invalid IBAN", () => expect(engine.validate([{ location: "body.iban", format: "iban" }], { body: { iban: "bad" } })).toHaveLength(1));
  it("supports required values", () => expect(engine.validate([{ location: "query.consentId", required: true }], { query: {} })).toHaveLength(1));
  it("supports equality rules", () => expect(engine.validate([{ location: "response.statusCode", equals: 200 }], { response: { statusCode: 201 } })).toHaveLength(1));
});
