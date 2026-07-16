import { MethodValidationResult } from "../../domain/models/MethodValidationResult";
import { MethodValidator } from "../../domain/validation/MethodValidator";

export class DefaultMethodValidator implements MethodValidator {
  public validate(
    requestMethod: string,
    availableMethods: string[]
  ): MethodValidationResult {
    const normalizedRequestMethod = requestMethod.trim().toUpperCase();

    const normalizedAllowedMethods = availableMethods.map((method) =>
      method.trim().toUpperCase()
    );

    return {
      valid: normalizedAllowedMethods.includes(normalizedRequestMethod),
      allowedMethods: normalizedAllowedMethods,
    };
  }
}
