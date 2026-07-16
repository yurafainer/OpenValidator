import type { JsonSchemaValidator } from "../../services/ports/JsonSchemaValidator";
import type { ReferenceResolver } from "../../services/ports/ReferenceResolver";
import type { RequestBodyResolver } from "../../services/ports/RequestBodyResolver";
import type { ValidationContext } from "../../../domain/validation/ValidationContext";
import { ValidationErrorCode } from "../../../domain/validation/ValidationErrorCode";
import { ValidationErrorFactory } from "../ValidationErrorFactory";
import type { RequestValidationStep } from "../RequestValidationStep";

export class BodyValidationStep implements RequestValidationStep {
  public readonly name = "body";

  constructor(
    private readonly requestBodyResolver: RequestBodyResolver,
    private readonly referenceResolver: ReferenceResolver,
    private readonly jsonSchemaValidator: JsonSchemaValidator,
  ) {}

  public validate(context: ValidationContext): void {
    if (!context.validatesRequestBody()) return;

    const model = context.operationModel;
    if (!model) return;

    const schema = this.requestBodyResolver.resolve(model.operation);
    context.requestBodySchemaFound = Boolean(schema);
    const required = this.isRequired(model.operation.requestBody, model.parameters);

    if (required && context.request.body === undefined) {
      context.addError(ValidationErrorFactory.create(
        ValidationErrorCode.BODY_REQUIRED,
        "body",
        "Request body is required",
        { expected: true },
      ));
      return;
    }

    if (!schema || context.request.body === undefined) return;

    const resolvedSchema = this.referenceResolver.resolve(context.specification, schema);
    const result = this.jsonSchemaValidator.validate(resolvedSchema, context.request.body);
    context.addErrors(result.errors.map((error) => {
      const location = error.path === "/" ? "body" : `body${error.path}`;
      return ValidationErrorFactory.fromLegacy({ ...error, path: location });
    }));
  }

  private isRequired(requestBody: unknown, parameters: Record<string, unknown>[]): boolean {
    if (requestBody && typeof requestBody === "object" && !Array.isArray(requestBody)) {
      return (requestBody as Record<string, unknown>).required === true;
    }
    return parameters.some((parameter) => parameter.in === "body" && parameter.required === true);
  }
}
