import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class RequiredRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (schema.type !== "object") {
            return [];
        }

        if (
            typeof data !== "object" ||
            data === null ||
            Array.isArray(data)
        ) {
            return [];
        }

        const errors: ValidationError[] = [];
        const objectData = data as Record<string, unknown>;

        for (const property of schema.required) {
            if (!(property in objectData)) {
                errors.push({
                    path: `${path}.${property}`,
                    message: `Missing required property '${property}'`,
                    keyword: "required",
                    expected: true,
                    actual: false
                });
            }
        }

        return errors;
    }
}