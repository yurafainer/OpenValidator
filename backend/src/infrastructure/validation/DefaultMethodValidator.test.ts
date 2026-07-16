import { describe, expect, it } from "vitest";
import { DefaultMethodValidator } from "./DefaultMethodValidator";

describe("DefaultMethodValidator", () => {
  const validator = new DefaultMethodValidator();

  it("should accept an allowed HTTP method", () => {
    const result = validator.validate("GET", ["GET", "POST"]);

    expect(result.valid).toBe(true);
    expect(result.allowedMethods).toEqual(["GET", "POST"]);
  });

  it("should compare methods case-insensitively", () => {
    const result = validator.validate("post", ["get", "POST"]);

    expect(result.valid).toBe(true);
    expect(result.allowedMethods).toEqual(["GET", "POST"]);
  });

  it("should ignore surrounding whitespace", () => {
    const result = validator.validate("  put  ", [" GET ", " put "]);

    expect(result.valid).toBe(true);
    expect(result.allowedMethods).toEqual(["GET", "PUT"]);
  });

  it("should reject a method that is not allowed", () => {
    const result = validator.validate("DELETE", ["GET", "POST"]);

    expect(result.valid).toBe(false);
    expect(result.allowedMethods).toEqual(["GET", "POST"]);
  });

  it("should reject every method when no methods are available", () => {
    const result = validator.validate("GET", []);

    expect(result.valid).toBe(false);
    expect(result.allowedMethods).toEqual([]);
  });
});
