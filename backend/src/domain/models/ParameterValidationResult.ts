import type { ValidationError } from "../validation/ValidationError";

export interface ParameterValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
