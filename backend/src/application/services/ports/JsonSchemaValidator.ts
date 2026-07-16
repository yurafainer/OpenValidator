export interface JsonSchemaValidationError {
  path: string;
  message: string;
  keyword?: string;
  expected?: unknown;
  actual?: unknown;
}

export interface JsonSchemaValidationResult {
  valid: boolean;
  errors: JsonSchemaValidationError[];
}

export interface JsonSchemaValidator {
  validate(
    schema: unknown,
    data: unknown,
  ): JsonSchemaValidationResult;
}
