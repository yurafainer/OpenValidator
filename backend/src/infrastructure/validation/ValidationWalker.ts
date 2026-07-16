import type { Schema } from "../../domain/specification/Schema";
import { ValidationContext } from "../../domain/validation/ValidationContext";

import type { ValidationRule } from "./rules/ValidationRule";

export class ValidationWalker {

    constructor(
        private readonly rules: ValidationRule[]
    ) {}

    public walk(
        schema: Schema,
        data: unknown
    ): ValidationContext {

        const context = new ValidationContext();

        for (const rule of this.rules) {
            context.addErrors(
                rule.validate(schema, data, "$")
            );
        }

        return context;
    }
}