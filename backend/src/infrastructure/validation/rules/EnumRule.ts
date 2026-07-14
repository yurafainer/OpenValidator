import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class EnumRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (!schema.enum || schema.enum.length === 0) {
            return [];
        }

        if (schema.enum.some(value => Object.is(value, data))) {
            return [];
        }

        return [
            {
                path,
                message: `Value must be one of the allowed enum values`,
                keyword: "enum",
                expected: schema.enum,
                actual: data
            }
        ];
    }
}