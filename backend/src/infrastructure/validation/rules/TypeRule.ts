import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class TypeRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        const actualType = this.getType(data);

        if (this.isTypeValid(schema.type, actualType)) {
            return [];
        }

        return [{
            path,
            message: `Expected type '${schema.type}', but received '${actualType}'`,
            keyword: "type",
            expected: schema.type,
            actual: actualType
        }];
    }

    private isTypeValid(
        expected: string,
        actual: string
    ): boolean {

        if (expected === actual) {
            return true;
        }

        return expected === "number"
            && actual === "integer";

    }

    private getType(value: unknown): string {

        if (value === null) {
            return "null";
        }

        if (Array.isArray(value)) {
            return "array";
        }

        if (Number.isInteger(value)) {
            return "integer";
        }

        return typeof value;

    }

}