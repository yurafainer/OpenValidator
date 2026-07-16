import type { ReferenceResolver } from "../../services/ports/ReferenceResolver";
import type { ParameterValidator } from "../../../domain/validation/ParameterValidator";
import type { ValidationContext } from "../../../domain/validation/ValidationContext";
import { ValidationErrorFactory } from "../ValidationErrorFactory";
import type { RequestValidationStep } from "../RequestValidationStep";

export class ParameterValidationStep implements RequestValidationStep {
  public readonly name = "parameters";

  constructor(
    private readonly referenceResolver: ReferenceResolver,
    private readonly parameterValidator: ParameterValidator,
  ) {}

  public validate(context: ValidationContext): void {
    if (!context.validatesRequestParameters()) return;

    const model = context.operationModel;
    if (!model) return;

    model.parameters = this.collectParameters(
      context.specification,
      model.pathItem.parameters,
      model.operation.parameters,
    );

    const headers = Object.fromEntries(
      Object.entries(context.request.headers).map(([name, value]) => [name.toLowerCase(), value]),
    );

    for (const parameter of model.parameters) {
      const location = String(parameter.in ?? "");
      const name = String(parameter.name ?? "");
      const value = this.getValue(
        location,
        name,
        model.pathParameters,
        context.request.query,
        headers,
      );

      const result = this.parameterValidator.validate(parameter, value);
      context.addErrors(result.errors.map((error) => ValidationErrorFactory.fromLegacy(error)));
    }
  }

  private collectParameters(
    specification: Record<string, unknown>,
    pathParameters: unknown,
    operationParameters: unknown,
  ): Record<string, unknown>[] {
    const combined = [
      ...(Array.isArray(pathParameters) ? pathParameters : []),
      ...(Array.isArray(operationParameters) ? operationParameters : []),
    ];
    const parameters = new Map<string, Record<string, unknown>>();

    for (const parameter of combined) {
      const resolved = this.referenceResolver.resolve(specification, parameter);
      if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) continue;
      const typed = resolved as Record<string, unknown>;
      parameters.set(`${String(typed.in ?? "")}:${String(typed.name ?? "")}`, typed);
    }

    return [...parameters.values()];
  }

  private getValue(
    location: string,
    name: string,
    pathParameters: Record<string, string>,
    query: Record<string, unknown>,
    headers: Record<string, unknown>,
  ): unknown {
    if (location === "path") return pathParameters[name];
    if (location === "query") return query[name];
    if (location === "header") return headers[name.toLowerCase()];
    return undefined;
  }
}
