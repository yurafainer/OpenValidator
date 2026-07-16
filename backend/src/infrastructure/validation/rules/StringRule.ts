import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class StringRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (schema.type !== "string" || typeof data !== "string") {
            return [];
        }

        const errors: ValidationError[] = [];

        if (
            schema.minLength !== undefined &&
            data.length < schema.minLength
        ) {
            errors.push({
                path,
                message: `String length must be at least ${schema.minLength}`,
                keyword: "minLength",
                expected: schema.minLength,
                actual: data.length
            });
        }

        if (
            schema.maxLength !== undefined &&
            data.length > schema.maxLength
        ) {
            errors.push({
                path,
                message: `String length must not exceed ${schema.maxLength}`,
                keyword: "maxLength",
                expected: schema.maxLength,
                actual: data.length
            });
        }

        if (schema.pattern !== undefined) {
            let regularExpression: RegExp;

            try {
                regularExpression = new RegExp(schema.pattern);
            } catch {
                return [
                    {
                        path,
                        message: `Invalid regular expression pattern '${schema.pattern}'`,
                        keyword: "pattern",
                        expected: schema.pattern,
                        actual: data
                    }
                ];
            }

            if (!regularExpression.test(data)) {
                errors.push({
                    path,
                    message: `String does not match pattern '${schema.pattern}'`,
                    keyword: "pattern",
                    expected: schema.pattern,
                    actual: data
                });
            }
        }

        return errors;
    }
}