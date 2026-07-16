import Ajv, { ErrorObject } from "ajv";
import { injectable } from "tsyringe";

import {
  JsonSchemaValidationError,
  JsonSchemaValidationResult,
  JsonSchemaValidator,
} from "../../application/services/ports/JsonSchemaValidator";

@injectable()
export class AjvJsonSchemaValidator implements JsonSchemaValidator {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
    });
  }

  public validate(
    schema: unknown,
    data: unknown,
  ): JsonSchemaValidationResult {
    if (!schema || typeof schema !== "object") {
      throw new Error("JSON schema is missing or invalid");
    }

    const validateFunction = this.ajv.compile(schema);
    const valid = validateFunction(data);

    return {
      valid: Boolean(valid),
      errors: this.mapErrors(validateFunction.errors, data),
    };
  }

  private mapErrors(
    errors: ErrorObject[] | null | undefined,
    data: unknown,
  ): JsonSchemaValidationError[] {
    if (!errors) return [];

    return errors.map((error) => {
      const path = this.resolveErrorPath(error);
      const actual = this.readValue(data, path);
      const expected = this.resolveExpected(error);

      return {
        path,
        keyword: error.keyword,
        actual,
        expected,
        message: this.createReadableMessage(error, actual, expected),
      };
    });
  }

  private resolveErrorPath(error: ErrorObject): string {
    if (error.keyword === "required") {
      const missingProperty = (error.params as { missingProperty?: string }).missingProperty;
      if (missingProperty) {
        return `${error.instancePath}/${this.escapeJsonPointer(missingProperty)}` || "/";
      }
    }
    return error.instancePath || "/";
  }

  private resolveExpected(error: ErrorObject): unknown {
    switch (error.keyword) {
      case "enum":
        return (error.params as { allowedValues?: unknown[] }).allowedValues;
      case "type":
        return (error.params as { type?: string }).type;
      case "required":
        return "property is required";
      case "pattern":
        return (error.params as { pattern?: string }).pattern;
      case "format":
        return (error.params as { format?: string }).format;
      case "minimum":
      case "maximum":
      case "exclusiveMinimum":
      case "exclusiveMaximum":
        return (error.params as { limit?: number }).limit;
      case "minLength":
      case "maxLength":
      case "minItems":
      case "maxItems":
        return (error.params as { limit?: number }).limit;
      case "additionalProperties":
        return "no additional properties";
      default:
        return undefined;
    }
  }

  private createReadableMessage(
    error: ErrorObject,
    actual: unknown,
    expected: unknown,
  ): string {
    switch (error.keyword) {
      case "enum":
        return `Invalid value ${this.formatValue(actual)}. Allowed values are: ${this.formatList(expected)}`;
      case "required": {
        const missingProperty = (error.params as { missingProperty?: string }).missingProperty;
        return `Required property '${missingProperty ?? "unknown"}' is missing`;
      }
      case "type":
        return `Invalid type. Received ${this.describeType(actual)}, expected ${String(expected)}`;
      case "pattern":
        return `Value ${this.formatValue(actual)} does not match the required pattern '${String(expected)}'`;
      case "format":
        return `Value ${this.formatValue(actual)} is not a valid ${String(expected)}`;
      case "minimum":
        return `Value ${this.formatValue(actual)} must be greater than or equal to ${String(expected)}`;
      case "maximum":
        return `Value ${this.formatValue(actual)} must be less than or equal to ${String(expected)}`;
      case "exclusiveMinimum":
        return `Value ${this.formatValue(actual)} must be greater than ${String(expected)}`;
      case "exclusiveMaximum":
        return `Value ${this.formatValue(actual)} must be less than ${String(expected)}`;
      case "minLength":
        return `Value must contain at least ${String(expected)} characters`;
      case "maxLength":
        return `Value must contain no more than ${String(expected)} characters`;
      case "minItems":
        return `Array must contain at least ${String(expected)} items`;
      case "maxItems":
        return `Array must contain no more than ${String(expected)} items`;
      case "additionalProperties": {
        const property = (error.params as { additionalProperty?: string }).additionalProperty;
        return `Property '${property ?? "unknown"}' is not allowed`;
      }
      default:
        return error.message ?? "Validation failed";
    }
  }

  private readValue(data: unknown, pointer: string): unknown {
    if (pointer === "/" || pointer === "") return data;
    const segments = pointer
      .split("/")
      .slice(1)
      .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

    let current: unknown = data;
    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  private escapeJsonPointer(value: string): string {
    return value.replace(/~/g, "~0").replace(/\//g, "~1");
  }

  private formatList(value: unknown): string {
    if (!Array.isArray(value)) return this.formatValue(value);
    return value.map((item) => this.formatValue(item)).join(", ");
  }

  private formatValue(value: unknown): string {
    if (typeof value === "string") return `'${value}'`;
    if (value === undefined) return "undefined";
    return JSON.stringify(value);
  }

  private describeType(value: unknown): string {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  }
}
