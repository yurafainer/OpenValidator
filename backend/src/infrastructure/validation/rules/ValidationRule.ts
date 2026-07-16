import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";

export interface ValidationRule {

    validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[];

}