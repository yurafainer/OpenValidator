import type { OpenApiOperation } from "../../../domain/openapi/OpenApiOperation";
import type { MethodValidator } from "../../../domain/validation/MethodValidator";
import type { ValidationContext } from "../../../domain/validation/ValidationContext";
import { ValidationErrorCode } from "../../../domain/validation/ValidationErrorCode";
import { ValidationErrorFactory } from "../ValidationErrorFactory";
import type { RequestValidationStep } from "../RequestValidationStep";

export class MethodValidationStep implements RequestValidationStep {
  public readonly name = "method";
  private readonly httpMethods = new Set([
    "get", "post", "put", "patch", "delete", "options", "head", "trace",
  ]);

  constructor(private readonly methodValidator: MethodValidator) {}

  public validate(context: ValidationContext): void {
    const model = context.operationModel;
    if (!model) {
      context.stop();
      return;
    }

    const availableMethods = Object.keys(model.pathItem)
      .filter((key) => this.httpMethods.has(key.toLowerCase()));
    const result = this.methodValidator.validate(context.request.method, availableMethods);
    model.allowedMethods = result.allowedMethods;

    if (!result.valid) {
      context.addError(ValidationErrorFactory.create(
        ValidationErrorCode.METHOD_NOT_ALLOWED,
        "method",
        `Method '${context.request.method.toUpperCase()}' is not allowed for path '${model.specificationPath}'`,
        {
          expected: result.allowedMethods,
          actual: context.request.method.toUpperCase(),
        },
      ));
      context.stop();
      return;
    }

    model.method = context.request.method.toLowerCase();
    model.operation = model.pathItem[model.method] as OpenApiOperation;
  }
}
