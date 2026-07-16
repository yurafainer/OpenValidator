import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { AjvJsonSchemaValidator } from "./AjvJsonSchemaValidator";

describe("AjvJsonSchemaValidator readable errors", () => {
  const validator = new AjvJsonSchemaValidator();

  it("returns actual and allowed enum values", () => {
    const result = validator.validate(
      {
        type: "object",
        properties: {
          mandateStatus: {
            type: "string",
            enum: ["received", "rejected", "valid"],
          },
        },
      },
      { mandateStatus: "RJCT" },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: "/mandateStatus",
      keyword: "enum",
      actual: "RJCT",
      expected: ["received", "rejected", "valid"],
      message: "Invalid value 'RJCT'. Allowed values are: 'received', 'rejected', 'valid'",
    });
  });

  it("includes the missing property in the path and message", () => {
    const result = validator.validate(
      {
        type: "object",
        required: ["mandateId"],
        properties: { mandateId: { type: "string" } },
      },
      {},
    );

    expect(result.errors[0].path).toBe("/mandateId");
    expect(result.errors[0].message).toBe("Required property 'mandateId' is missing");
    expect(result.errors[0].keyword).toBe("required");
  });
});
