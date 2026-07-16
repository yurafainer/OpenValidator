import type { ValidationError } from "./ValidationError";

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}