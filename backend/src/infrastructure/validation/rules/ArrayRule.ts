import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";

export class ArrayRule implements ValidationRule {

    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (schema.type !== "array" || !Array.isArray(data)) {
            return [];
        }

        const errors: ValidationError[] = [];

        if (
            schema.minItems !== undefined &&
            data.length < schema.minItems
        ) {
            errors.push({
                path,
                message: `Array must contain at least ${schema.minItems} items`,
                keyword: "minItems",
                expected: schema.minItems,
                actual: data.length
            });
        }

        if (
            schema.maxItems !== undefined &&
            data.length > schema.maxItems
        ) {
            errors.push({
                path,
                message: `Array must contain no more than ${schema.maxItems} items`,
                keyword: "maxItems",
                expected: schema.maxItems,
                actual: data.length
            });
        }

        if (
            schema.uniqueItems === true &&
            !this.hasUniqueItems(data)
        ) {
            errors.push({
                path,
                message: "Array items must be unique",
                keyword: "uniqueItems",
                expected: true,
                actual: false
            });
        }

        return errors;
    }

    private hasUniqueItems(items: unknown[]): boolean {
        for (let firstIndex = 0; firstIndex < items.length; firstIndex++) {
            for (
                let secondIndex = firstIndex + 1;
                secondIndex < items.length;
                secondIndex++
            ) {
                if (
                    this.areEqual(
                        items[firstIndex],
                        items[secondIndex]
                    )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private areEqual(
        firstValue: unknown,
        secondValue: unknown
    ): boolean {

        if (Object.is(firstValue, secondValue)) {
            return true;
        }

        if (
            typeof firstValue !== "object" ||
            firstValue === null ||
            typeof secondValue !== "object" ||
            secondValue === null
        ) {
            return false;
        }

        try {
            return JSON.stringify(firstValue) === JSON.stringify(secondValue);
        } catch {
            return false;
        }
    }
}