import type { ParameterValidationResult } from "../models/ParameterValidationResult";

export interface ParameterValidator {
  validate(
    parameter: Record<string, unknown>,
    value: unknown,
  ): ParameterValidationResult;
}
