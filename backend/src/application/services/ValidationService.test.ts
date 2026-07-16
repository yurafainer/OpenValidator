import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { ValidationService } from "./ValidationService";
import { OpenApiReferenceResolver } from "../../infrastructure/openapi/OpenApiReferenceResolver";
import { OpenApiRequestBodyResolver } from "../../infrastructure/openapi/OpenApiRequestBodyResolver";
import { AjvJsonSchemaValidator } from "../../infrastructure/validation/AjvJsonSchemaValidator";
import { DefaultMethodValidator } from "../../infrastructure/validation/DefaultMethodValidator";
import { DefaultParameterValidator } from "../../infrastructure/validation/DefaultParameterValidator";
import { DefaultPathMatcher } from "../../infrastructure/validation/DefaultPathMatcher";
import { ValidationMode } from "../../domain/validation/ValidationMode";

const specification = {
  fileName: "test.yaml",
  content: `
openapi: 3.0.0
paths:
  /accounts/{accountId}:
    parameters:
      - name: accountId
        in: path
        required: true
        schema:
          type: string
          pattern: '^[0-9]+$'
    post:
      parameters:
        - name: bookingStatus
          in: query
          required: true
          schema:
            type: string
            enum: [booked, pending]
        - name: x-request-id
          in: header
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount]
              properties:
                amount:
                  type: number
      responses:
        "200":
          description: Success
          headers:
            x-response-id:
              required: true
              schema:
                type: string
          content:
            application/json:
              schema:
                type: object
                required: [result]
                properties:
                  result:
                    type: string
`,
};

function createService(): ValidationService {
  return new ValidationService(
    new OpenApiRequestBodyResolver(),
    new OpenApiReferenceResolver(),
    new AjvJsonSchemaValidator(),
    new DefaultPathMatcher(),
    new DefaultMethodValidator(),
    new DefaultParameterValidator(),
  );
}

describe("ValidationService", () => {
  it("should validate path, method, parameters and body", async () => {
    const result = await createService().validate(specification, "/accounts/123", "post", {
      query: { bookingStatus: "booked" },
      headers: { "X-Request-Id": "request-1" },
      body: { amount: 10 },
    }) as any;

    expect(result.valid).toBe(true);
    expect(result.pathParameters).toEqual({ accountId: "123" });
    expect(result.pipeline).toEqual(["path", "method", "parameters", "body", "response"]);
  });

  it("should return all request validation errors", async () => {
    const result = await createService().validate(specification, "/accounts/ABC", "POST", {
      query: { bookingStatus: "invalid" },
      body: {},
    }) as any;

    expect(result.valid).toBe(false);
    expect(result.errors.map((error: any) => error.path)).toEqual(expect.arrayContaining([
      "path.accountId", "query.bookingStatus", "header.x-request-id", "body/amount",
    ]));
  });

  it("should validate only the request body in BODY mode", async () => {
    const result = await createService().validate(specification, "/accounts/123", "post", {
      validationMode: ValidationMode.BODY,
      body: { amount: 10 },
    }) as any;

    expect(result.valid).toBe(true);
    expect(result.validationMode).toBe("BODY");
  });

  it("should validate a response body and headers", async () => {
    const result = await createService().validate(specification, "/accounts/123", "post", {
      validationMode: ValidationMode.RESPONSE,
      response: {
        statusCode: 200,
        headers: { "x-response-id": "response-1" },
        body: { result: "ok" },
      },
    }) as any;

    expect(result.valid).toBe(true);
    expect(result.responseBodySchemaFound).toBe(true);
  });

  it("should report response validation errors", async () => {
    const result = await createService().validate(specification, "/accounts/123", "post", {
      validationMode: ValidationMode.RESPONSE,
      response: { statusCode: 200, headers: {}, body: {} },
    }) as any;

    expect(result.valid).toBe(false);
    expect(result.errors.map((error: any) => error.path)).toEqual(expect.arrayContaining([
      "response.header.x-response-id", "response.body/result",
    ]));
  });

  it("should reject a response status that is not defined", async () => {
    const result = await createService().validate(specification, "/accounts/123", "post", {
      validationMode: ValidationMode.RESPONSE,
      response: { statusCode: 404, headers: {}, body: {} },
    }) as any;

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("RESPONSE_STATUS_NOT_DEFINED");
  });
});
