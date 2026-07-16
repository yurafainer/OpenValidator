import { describe, expect, it } from "vitest";

import type { Schema } from "../../domain/specification/Schema";
import { DefaultSpecificationValidator } from "./DefaultSpecificationValidator";

describe("DefaultSpecificationValidator", () => {

    const validator = new DefaultSpecificationValidator();
it("should validate property types", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: [],
        properties: new Map([
            [
                "name",
                {
                    name: "name",
                    type: "string"
                }
            ],
            [
                "age",
                {
                    name: "age",
                    type: "integer"
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        name: "John",
        age: "20"
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.age");
    expect(result.errors[0]?.keyword).toBe("type");
});
    it("should return valid when data type matches schema type", () => {

        const schema: Schema = {
            name: "Person",
            type: "object",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, {
            name: "John"
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);

    });

    it("should return an error when data type does not match schema type", () => {

        const schema: Schema = {
            name: "Person",
            type: "object",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, "not an object");

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);

        expect(result.errors[0]).toEqual({
            path: "$",
            message: "Expected type 'object', but received 'string'",
            keyword: "type",
            expected: "object",
            actual: "string"
        });

    });

    it("should distinguish between integer and integer schema", () => {

        const schema: Schema = {
            name: "Amount",
            type: "integer",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, 10);

        expect(result.valid).toBe(true);

    });

    it("should detect arrays correctly", () => {

        const schema: Schema = {
            name: "Items",
            type: "array",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, []);

        expect(result.valid).toBe(true);

    });

    it("should detect null correctly", () => {

        const schema: Schema = {
            name: "NullableValue",
            type: "null",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, null);

        expect(result.valid).toBe(true);

    });

    it("should accept an integer when schema type is number", () => {

        const schema: Schema = {
            name: "Amount",
            type: "number",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, 10);

        expect(result.valid).toBe(true);

    });
    it("should accept valid property types", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: [],
        properties: new Map([
            [
                "name",
                {
                    name: "name",
                    type: "string"
                }
            ],
            [
                "age",
                {
                    name: "age",
                    type: "integer"
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        name: "John",
        age: 20
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
});
it("should validate nested object properties recursively", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: [],
        properties: new Map([
            [
                "address",
                {
                    name: "address",
                    type: "object",
                    required: ["city"],
                    properties: new Map([
                        [
                            "city",
                            {
                                name: "city",
                                type: "string"
                            }
                        ],
                        [
                            "zipCode",
                            {
                                name: "zipCode",
                                type: "integer"
                            }
                        ]
                    ])
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        address: {
            city: "Tel Aviv",
            zipCode: "12345"
        }
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.address.zipCode");
    expect(result.errors[0]?.keyword).toBe("type");
});
it("should report missing required property inside nested object", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: [],
        properties: new Map([
            [
                "address",
                {
                    name: "address",
                    type: "object",
                    required: ["city"],
                    properties: new Map([
                        [
                            "city",
                            {
                                name: "city",
                                type: "string"
                            }
                        ]
                    ])
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        address: {}
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.address.city");
    expect(result.errors[0]?.keyword).toBe("required");
});

it("should validate array item types", () => {

    const schema: Schema = {
        name: "Numbers",
        type: "object",
        required: [],
        properties: new Map([
            [
                "values",
                {
                    name: "values",
                    type: "array",
                    items: {
                        name: "value",
                        type: "integer"
                    }
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        values: [1, 2, "3", 4]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.values[2]");
    expect(result.errors[0]?.keyword).toBe("type");
});

it("should validate object properties inside arrays recursively", () => {

    const schema: Schema = {
        name: "People",
        type: "object",
        required: [],
        properties: new Map([
            [
                "people",
                {
                    name: "people",
                    type: "array",
                    items: {
                        name: "person",
                        type: "object",
                        required: ["name"],
                        properties: new Map([
                            [
                                "name",
                                {
                                    name: "name",
                                    type: "string"
                                }
                            ],
                            [
                                "age",
                                {
                                    name: "age",
                                    type: "integer"
                                }
                            ]
                        ])
                    }
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        people: [
            {
                name: "John",
                age: 30
            },
            {
                name: "Sarah",
                age: "25"
            }
        ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.people[1].age");
    expect(result.errors[0]?.keyword).toBe("type");
});
it("should report missing required property inside array item", () => {

    const schema: Schema = {
        name: "People",
        type: "object",
        required: [],
        properties: new Map([
            [
                "people",
                {
                    name: "people",
                    type: "array",
                    items: {
                        name: "person",
                        type: "object",
                        required: ["name"],
                        properties: new Map([
                            [
                                "name",
                                {
                                    name: "name",
                                    type: "string"
                                }
                            ]
                        ])
                    }
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        people: [
            {
                name: "John"
            },
            {}
        ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("$.people[1].name");
    expect(result.errors[0]?.keyword).toBe("required");
});
it("should reject string shorter than minLength", () => {
    const schema: Schema = {
        name: "Username",
        type: "string",
        required: [],
        properties: new Map(),
        minLength: 5
    };

    const result = validator.validate(schema, "abc");

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe("minLength");
    expect(result.errors[0]?.path).toBe("$");
});
it("should reject string longer than maxLength", () => {
    const schema: Schema = {
        name: "Username",
        type: "string",
        required: [],
        properties: new Map(),
        maxLength: 5
    };

    const result = validator.validate(schema, "abcdefgh");

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe("maxLength");
});
it("should reject string that does not match pattern", () => {
    const schema: Schema = {
        name: "Code",
        type: "string",
        required: [],
        properties: new Map(),
        pattern: "^[A-Z]{3}$"
    };

    const result = validator.validate(schema, "ab1");

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe("pattern");
});
it("should validate string rules inside object property", () => {
    const schema: Schema = {
        name: "Person",
        type: "object",
        required: [],
        properties: new Map([
            [
                "code",
                {
                    name: "code",
                    type: "string",
                    minLength: 3,
                    pattern: "^[A-Z]+$"
                }
            ]
        ])
    };

    const result = validator.validate(schema, {
        code: "a"
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map(error => error.keyword)).toEqual([
        "minLength",
        "pattern"
    ]);
});
it("should accept object when all required properties exist", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: ["name", "age"],
        properties: new Map()
    };

    const result = validator.validate(schema, {
        name: "John",
        age: 20
    });

    expect(result.valid).toBe(true);

});
it("should report missing required property", () => {

    const schema: Schema = {
        name: "Person",
        type: "object",
        required: ["name", "age"],
        properties: new Map()
    };

    const result = validator.validate(schema, {
        name: "John"
    });

    expect(result.valid).toBe(false);

    expect(result.errors).toHaveLength(1);

    expect(result.errors[0].keyword).toBe("required");

    expect(result.errors[0].path).toBe("$.age");

});
    it("should reject a decimal when schema type is integer", () => {

        const schema: Schema = {
            name: "Amount",
            type: "integer",
            required: [],
            properties: new Map()
        };

        const result = validator.validate(schema, 10.5);

        expect(result.valid).toBe(false);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].keyword).toBe("type");
        expect(result.errors[0].expected).toBe("integer");
        expect(result.errors[0].actual).toBe("number");

    });

});