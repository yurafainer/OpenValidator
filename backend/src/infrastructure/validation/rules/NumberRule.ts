import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class NumberRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (
            schema.type !== "number" &&
            schema.type !== "integer"
        ) {
            return [];
        }

        if (typeof data !== "number" || Number.isNaN(data)) {
            return [];
        }

        const errors: ValidationError[] = [];

        if (
            schema.minimum !== undefined &&
            data < schema.minimum
        ) {
            errors.push({
                path,
                message: `Number must be greater than or equal to ${schema.minimum}`,
                keyword: "minimum",
                expected: schema.minimum,
                actual: data
            });
        }

        if (
            schema.maximum !== undefined &&
            data > schema.maximum
        ) {
            errors.push({
                path,
                message: `Number must be less than or equal to ${schema.maximum}`,
                keyword: "maximum",
                expected: schema.maximum,
                actual: data
            });
        }

        return errors;
    }
}