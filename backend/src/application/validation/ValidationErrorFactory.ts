import type { ValidationError } from "../../domain/validation/ValidationError";
import { ValidationErrorCode } from "../../domain/validation/ValidationErrorCode";
import { ValidationSeverity } from "../../domain/validation/ValidationSeverity";

export class ValidationErrorFactory {
  public static create(
    code: ValidationErrorCode,
    location: string,
    message: string,
    options: { expected?: unknown; actual?: unknown; keyword?: string } = {},
  ): ValidationError {
    return {
      code,
      location,
      path: location,
      message,
      severity: ValidationSeverity.ERROR,
      keyword: options.keyword ?? this.toLegacyKeyword(code),
      expected: options.expected,
      actual: options.actual,
    };
  }

  public static fromLegacy(error: {
    path?: string;
    message: string;
    keyword?: string;
    expected?: unknown;
    actual?: unknown;
  }): ValidationError {
    const location = error.path ?? "validation";
    const keywordCode = this.fromKeyword(error.keyword);
    const code = keywordCode !== ValidationErrorCode.BODY_VALIDATION_FAILED
      ? keywordCode
      : location.startsWith("response.body")
        ? ValidationErrorCode.RESPONSE_BODY_VALIDATION_FAILED
        : ValidationErrorCode.BODY_VALIDATION_FAILED;

    return this.create(
      code,
      location,
      error.message,
      error,
    );
  }

  private static fromKeyword(keyword?: string): ValidationErrorCode {
    switch (keyword) {
      case "required": return ValidationErrorCode.PARAMETER_REQUIRED;
      case "pattern": return ValidationErrorCode.INVALID_PATTERN;
      case "type": return ValidationErrorCode.INVALID_TYPE;
      case "enum": return ValidationErrorCode.INVALID_ENUM;
      case "format": return ValidationErrorCode.INVALID_FORMAT;
      case "minimum":
      case "maximum": return ValidationErrorCode.INVALID_RANGE;
      case "minLength":
      case "maxLength":
      case "minItems":
      case "maxItems": return ValidationErrorCode.INVALID_LENGTH;
      default: return ValidationErrorCode.BODY_VALIDATION_FAILED;
    }
  }

  private static toLegacyKeyword(code: ValidationErrorCode): string {
    switch (code) {
      case ValidationErrorCode.PATH_NOT_FOUND: return "path";
      case ValidationErrorCode.METHOD_NOT_ALLOWED: return "method";
      case ValidationErrorCode.PARAMETER_REQUIRED:
      case ValidationErrorCode.BODY_REQUIRED: return "required";
      case ValidationErrorCode.INVALID_PATTERN: return "pattern";
      case ValidationErrorCode.INVALID_TYPE: return "type";
      case ValidationErrorCode.INVALID_ENUM: return "enum";
      default: return "validation";
    }
  }
}
