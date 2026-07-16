import type { ParameterValidationResult } from "../../domain/models/ParameterValidationResult";
import type { ParameterValidator } from "../../domain/validation/ParameterValidator";
import type { ValidationError } from "../../domain/validation/ValidationError";

export class DefaultParameterValidator implements ParameterValidator {
  public validate(
    parameter: Record<string, unknown>,
    value: unknown,
  ): ParameterValidationResult {
    const name = String(parameter.name ?? "parameter");
    const location = String(parameter.in ?? "unknown");
    const path = `${location}.${name}`;
    const required = parameter.required === true || location === "path";
    const missing = value === undefined || value === null || value === "";

    if (missing) {
      return required
        ? this.invalid(path, "Parameter is required", "required", true, value)
        : { valid: true, errors: [] };
    }

    const schema = this.getSchema(parameter);
    const errors: ValidationError[] = [];
    const type = typeof schema.type === "string" ? schema.type : undefined;

    if (type && !this.matchesType(type, value)) {
      errors.push({
        path,
        message: `Parameter must be of type ${type}`,
        keyword: "type",
        expected: type,
        actual: value,
      });
      return { valid: false, errors };
    }

    const normalizedValue = this.normalizeValue(type, value);

    if (Array.isArray(schema.enum) && !schema.enum.includes(normalizedValue)) {
      errors.push({
        path,
        message: "Parameter value is not one of the allowed values",
        keyword: "enum",
        expected: schema.enum,
        actual: normalizedValue,
      });
    }

    if (typeof normalizedValue === "string") {
      this.validateString(schema, normalizedValue, path, errors);
    }

    if (typeof normalizedValue === "number") {
      this.validateNumber(schema, normalizedValue, path, errors);
    }

    if (Array.isArray(normalizedValue)) {
      this.validateArray(schema, normalizedValue, path, errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getSchema(
    parameter: Record<string, unknown>,
  ): Record<string, any> {
    const nestedSchema = parameter.schema;

    if (nestedSchema && typeof nestedSchema === "object") {
      return nestedSchema as Record<string, any>;
    }

    return parameter as Record<string, any>;
  }

  private matchesType(type: string, value: unknown): boolean {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "integer":
        return this.toNumber(value, true) !== undefined;
      case "number":
        return this.toNumber(value, false) !== undefined;
      case "boolean":
        return typeof value === "boolean" || value === "true" || value === "false";
      case "array":
        return Array.isArray(value) || typeof value === "string";
      case "object":
        return typeof value === "object" && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private normalizeValue(type: string | undefined, value: unknown): unknown {
    if (type === "integer") {
      return this.toNumber(value, true);
    }

    if (type === "number") {
      return this.toNumber(value, false);
    }

    if (type === "boolean" && typeof value === "string") {
      return value === "true";
    }

    if (type === "array" && typeof value === "string") {
      return value.split(",").map((item) => item.trim());
    }

    return value;
  }

  private toNumber(value: unknown, integer: boolean): number | undefined {
    if (typeof value === "number") {
      return Number.isFinite(value) && (!integer || Number.isInteger(value))
        ? value
        : undefined;
    }

    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || (integer && !Number.isInteger(numberValue))) {
      return undefined;
    }

    return numberValue;
  }

  private validateString(
    schema: Record<string, any>,
    value: string,
    path: string,
    errors: ValidationError[],
  ): void {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push({
        path,
        message: `Parameter must contain at least ${schema.minLength} characters`,
        keyword: "minLength",
        expected: schema.minLength,
        actual: value.length,
      });
    }

    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `Parameter must contain at most ${schema.maxLength} characters`,
        keyword: "maxLength",
        expected: schema.maxLength,
        actual: value.length,
      });
    }

    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern).test(value)) {
          errors.push({
            path,
            message: "Parameter does not match the required pattern",
            keyword: "pattern",
            expected: schema.pattern,
            actual: value,
          });
        }
      } catch {
        errors.push({
          path,
          message: "Specification contains an invalid parameter pattern",
          keyword: "pattern",
          expected: schema.pattern,
        });
      }
    }
  }

  private validateNumber(
    schema: Record<string, any>,
    value: number,
    path: string,
    errors: ValidationError[],
  ): void {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      errors.push({
        path,
        message: `Parameter must be greater than or equal to ${schema.minimum}`,
        keyword: "minimum",
        expected: schema.minimum,
        actual: value,
      });
    }

    if (typeof schema.maximum === "number" && value > schema.maximum) {
      errors.push({
        path,
        message: `Parameter must be less than or equal to ${schema.maximum}`,
        keyword: "maximum",
        expected: schema.maximum,
        actual: value,
      });
    }
  }

  private validateArray(
    schema: Record<string, any>,
    value: unknown[],
    path: string,
    errors: ValidationError[],
  ): void {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push({
        path,
        message: `Parameter must contain at least ${schema.minItems} items`,
        keyword: "minItems",
        expected: schema.minItems,
        actual: value.length,
      });
    }

    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      errors.push({
        path,
        message: `Parameter must contain at most ${schema.maxItems} items`,
        keyword: "maxItems",
        expected: schema.maxItems,
        actual: value.length,
      });
    }
  }

  private invalid(
    path: string,
    message: string,
    keyword: string,
    expected?: unknown,
    actual?: unknown,
  ): ParameterValidationResult {
    return {
      valid: false,
      errors: [{ path, message, keyword, expected, actual }],
    };
  }
}
