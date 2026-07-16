import { ValidationErrorCode } from "./ValidationErrorCode";
import { ValidationSeverity } from "./ValidationSeverity";

export interface ValidationError {
  code?: ValidationErrorCode;
  location?: string;
  message: string;
  severity?: ValidationSeverity;
  expected?: unknown;
  actual?: unknown;

  /** @deprecated Use location. Kept for API compatibility. */
  path?: string;
  /** @deprecated Use code. Kept for API compatibility. */
  keyword?: string;
}
