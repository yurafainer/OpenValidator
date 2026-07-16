import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationResult } from "../../../domain/validation/ValidationResult";

export interface SpecificationValidator {
    validate(
        schema: Schema,
        data: unknown
    ): ValidationResult;
}