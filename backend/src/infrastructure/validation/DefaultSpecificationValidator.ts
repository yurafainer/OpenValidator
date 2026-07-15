import type { SpecificationValidator } from "../../application/services/ports/SpecificationValidator";
import type { Schema } from "../../domain/specification/Schema";
import type { ValidationError } from "../../domain/validation/ValidationError";
import type { ValidationResult } from "../../domain/validation/ValidationResult";
import { injectable } from "tsyringe";
import { ArrayRule } from "./rules/ArrayRule";
import { EnumRule } from "./rules/EnumRule";
import { NumberRule } from "./rules/NumberRule";
import { PropertiesRule } from "./rules/PropertiesRule";
import { RequiredRule } from "./rules/RequiredRule";
import { StringRule } from "./rules/StringRule";
import { TypeRule } from "./rules/TypeRule";
import type { ValidationRule } from "./rules/ValidationRule";

export class DefaultSpecificationValidator
    implements SpecificationValidator {

    private readonly rules: ValidationRule[] = [
        new TypeRule(),
        new RequiredRule(),
        new EnumRule(),
        new StringRule(),
        new NumberRule(),
        new ArrayRule(),
        new PropertiesRule()
    ];

    public validate(
        schema: Schema,
        data: unknown
    ): ValidationResult {

        const errors: ValidationError[] = [];

        for (const rule of this.rules) {
            errors.push(
                ...rule.validate(schema, data, "$")
            );
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}