import type { Property } from "../../../domain/specification/Property";
import type { Schema } from "../../../domain/specification/Schema";
import type { ValidationError } from "../../../domain/validation/ValidationError";
import type { ValidationRule } from "./ValidationRule";
import { StringRule } from "./StringRule";
import { EnumRule } from "./EnumRule";
import { RequiredRule } from "./RequiredRule";
import { TypeRule } from "./TypeRule";
import { NumberRule } from "./NumberRule";
import { ArrayRule } from "./ArrayRule";
export class PropertiesRule implements ValidationRule {

    private readonly enumRule = new EnumRule();
    private readonly typeRule = new TypeRule();
    private readonly requiredRule = new RequiredRule();
    private readonly stringRule = new StringRule();
    private readonly numberRule = new NumberRule();
    private readonly arrayRule = new ArrayRule();
    public validate(
        schema: Schema,
        data: unknown,
        path: string
    ): ValidationError[] {

        return this.validateObjectProperties(
            schema.properties,
            data,
            path
        );
    }

    private validateObjectProperties(
        properties: Map<string, Property>,
        data: unknown,
        path: string
    ): ValidationError[] {

        if (!this.isObject(data)) {
            return [];
        }

        const objectData = data as Record<string, unknown>;
        const errors: ValidationError[] = [];

        for (const [propertyName, propertySchema] of properties) {

            if (!(propertyName in objectData)) {
                continue;
            }

            errors.push(
                ...this.validateProperty(
                    propertySchema,
                    objectData[propertyName],
                    `${path}.${propertyName}`
                )
            );
        }

        return errors;
    }

    private validateProperty(
        property: Property,
        value: unknown,
        path: string
    ): ValidationError[] {

        const errors: ValidationError[] = [];
        const schema = this.toSchema(property);

        if (schema) {
            errors.push(
                ...this.typeRule.validate(
                    schema,
                    value,
                    path
                )
            );

            errors.push(
                ...this.enumRule.validate(
                    schema,
                    value,
                    path
                )
            );
errors.push(
    ...this.stringRule.validate(
        schema,
        value,
        path
    )
);errors.push(
    ...this.numberRule.validate(
        schema,
        value,
        path
    )
);errors.push(
    ...this.arrayRule.validate(
        schema,
        value,
        path
    )
);
            if (
                schema.type === "object" &&
                this.isObject(value)
            ) {
                errors.push(
                    ...this.requiredRule.validate(
                        schema,
                        value,
                        path
                    )
                );
            }
        }

        if (
            property.type === "object" &&
            property.properties &&
            this.isObject(value)
        ) {
            errors.push(
                ...this.validateObjectProperties(
                    property.properties,
                    value,
                    path
                )
            );
        }

        if (
            property.type === "array" &&
            property.items &&
            Array.isArray(value)
        ) {
            const itemSchema = property.items;

            for (let index = 0; index < value.length; index++) {
                errors.push(
                    ...this.validateProperty(
                        itemSchema,
                        value[index],
                        `${path}[${index}]`
                    )
                );
            }
        }

        return errors;
    }

    private toSchema(
        property: Property
    ): Schema | undefined {

        if (!property.type) {
            return undefined;
        }

        return {
            ...property,
            name: property.name,
            type: property.type,
            required: property.required ?? [],
            properties: property.properties ?? new Map()
        };
    }

    private isObject(value: unknown): boolean {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }
}