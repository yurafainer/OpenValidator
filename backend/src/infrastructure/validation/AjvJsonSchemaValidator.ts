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
      errors: this.mapErrors(validateFunction.errors),
    };
  }

  private mapErrors(
    errors: ErrorObject[] | null | undefined,
  ): JsonSchemaValidationError[] {
    if (!errors) {
      return [];
    }

    return errors.map((error) => ({
      path: error.instancePath || "/",
      message: error.message ?? "Validation failed",
    }));
  }
}