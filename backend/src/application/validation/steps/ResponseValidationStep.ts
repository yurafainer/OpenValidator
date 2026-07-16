import type { JsonSchemaValidator } from "../../services/ports/JsonSchemaValidator";
import type { ReferenceResolver } from "../../services/ports/ReferenceResolver";
import type { ValidationContext } from "../../../domain/validation/ValidationContext";
import { ValidationErrorCode } from "../../../domain/validation/ValidationErrorCode";
import { ValidationErrorFactory } from "../ValidationErrorFactory";
import type { RequestValidationStep } from "../RequestValidationStep";

export class ResponseValidationStep implements RequestValidationStep {
  public readonly name = "response";

  constructor(
    private readonly referenceResolver: ReferenceResolver,
    private readonly jsonSchemaValidator: JsonSchemaValidator,
  ) {}

  public validate(context: ValidationContext): void {
    if (!context.validatesResponse()) return;
    const model = context.operationModel;
    const response = context.response;
    if (!model || !response) return;

    const responses = model.operation.responses;
    if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
      context.addError(ValidationErrorFactory.create(
        ValidationErrorCode.RESPONSE_STATUS_NOT_DEFINED,
        `response.statusCode`,
        `No responses are defined for operation '${model.method.toUpperCase()} ${model.specificationPath}'`,
        { actual: response.statusCode },
      ));
      return;
    }

    const responseDefinition = this.findResponse(
      responses as Record<string, unknown>,
      response.statusCode,
    );
    if (!responseDefinition) {
      context.addError(ValidationErrorFactory.create(
        ValidationErrorCode.RESPONSE_STATUS_NOT_DEFINED,
        "response.statusCode",
        `Response status '${response.statusCode}' is not defined`,
        { actual: response.statusCode, expected: Object.keys(responses) },
      ));
      return;
    }

    const resolved = this.referenceResolver.resolve(context.specification, responseDefinition);
    if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) return;
    const definition = resolved as Record<string, unknown>;

    this.validateHeaders(context, definition.headers, response.headers);
    const schema = this.resolveSchema(definition);
    context.responseBodySchemaFound = Boolean(schema);
    if (!schema || response.body === undefined) return;

    const resolvedSchema = this.referenceResolver.resolve(context.specification, schema);
    const result = this.jsonSchemaValidator.validate(resolvedSchema, response.body);
    context.addErrors(result.errors.map((error) => {
      const location = error.path === "/" ? "response.body" : `response.body${error.path}`;
      return ValidationErrorFactory.fromLegacy({ ...error, path: location });
    }));
  }

  private findResponse(responses: Record<string, unknown>, statusCode: number): unknown {
    const exact = responses[String(statusCode)];
    if (exact) return exact;
    const range = `${Math.floor(statusCode / 100)}XX`;
    return responses[range] ?? responses[range.toLowerCase()] ?? responses.default;
  }

  private resolveSchema(definition: Record<string, unknown>): unknown {
    if (definition.schema) return definition.schema; // Swagger 2.0
    const content = definition.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) return undefined;
    const typed = content as Record<string, unknown>;
    const media = typed["application/json"] ?? typed["application/problem+json"] ?? Object.values(typed)[0];
    if (!media || typeof media !== "object" || Array.isArray(media)) return undefined;
    return (media as Record<string, unknown>).schema;
  }

  private validateHeaders(
    context: ValidationContext,
    definitions: unknown,
    actualHeaders: Record<string, unknown>,
  ): void {
    if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) return;
    const normalized = Object.fromEntries(
      Object.entries(actualHeaders).map(([name, value]) => [name.toLowerCase(), value]),
    );
    for (const [name, rawDefinition] of Object.entries(definitions as Record<string, unknown>)) {
      const resolved = this.referenceResolver.resolve(context.specification, rawDefinition);
      if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) continue;
      const definition = resolved as Record<string, unknown>;
      const value = normalized[name.toLowerCase()];
      if (definition.required === true && value === undefined) {
        context.addError(ValidationErrorFactory.create(
          ValidationErrorCode.RESPONSE_HEADER_REQUIRED,
          `response.header.${name.toLowerCase()}`,
          `Response header '${name}' is required`,
          { expected: true },
        ));
        continue;
      }
      if (value === undefined) continue;
      const schema = definition.schema ?? definition;
      const result = this.jsonSchemaValidator.validate(schema, value);
      context.addErrors(result.errors.map((error) => ValidationErrorFactory.fromLegacy({
        ...error,
        path: `response.header.${name.toLowerCase()}`,
      })));
    }
  }
}
