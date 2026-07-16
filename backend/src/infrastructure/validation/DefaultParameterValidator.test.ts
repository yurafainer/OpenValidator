import { describe, expect, it } from "vitest";
import { DefaultParameterValidator } from "./DefaultParameterValidator";

describe("DefaultParameterValidator", () => {
  const validator = new DefaultParameterValidator();

  it("should reject a missing required parameter", () => {
    const result = validator.validate(
      { name: "x-request-id", in: "header", required: true, type: "string" },
      undefined,
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].keyword).toBe("required");
  });

  it("should validate an integer supplied as a string", () => {
    const result = validator.validate(
      { name: "page", in: "query", type: "integer", minimum: 1 },
      "2",
    );

    expect(result.valid).toBe(true);
  });

  it("should reject an invalid enum value", () => {
    const result = validator.validate(
      {
        name: "status",
        in: "query",
        schema: { type: "string", enum: ["booked", "pending"] },
      },
      "cancelled",
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].keyword).toBe("enum");
  });

  it("should validate a string pattern", () => {
    const result = validator.validate(
      {
        name: "accountId",
        in: "path",
        required: true,
        type: "string",
        pattern: "^[0-9]+$",
      },
      "ABC",
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].keyword).toBe("pattern");
  });
});
