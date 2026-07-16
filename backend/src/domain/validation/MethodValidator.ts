import { MethodValidationResult } from "../models/MethodValidationResult";

export interface MethodValidator {
  validate(
    requestMethod: string,
    availableMethods: string[]
  ): MethodValidationResult;
}