import type { PathMatcher } from "../../../domain/validation/PathMatcher";
import type { ValidationContext } from "../../../domain/validation/ValidationContext";
import { ValidationErrorCode } from "../../../domain/validation/ValidationErrorCode";
import { ValidationErrorFactory } from "../ValidationErrorFactory";
import type { RequestValidationStep } from "../RequestValidationStep";

export class PathValidationStep implements RequestValidationStep {
  public readonly name = "path";

  constructor(private readonly pathMatcher: PathMatcher) {}

  public validate(context: ValidationContext): void {
    const match = this.pathMatcher.match(
      context.request.path,
      Object.keys(context.specification.paths),
    );

    if (!match.matched || !match.specificationPath) {
      context.addError(ValidationErrorFactory.create(
        ValidationErrorCode.PATH_NOT_FOUND,
        "path",
        `Path '${context.request.path}' was not found in the specification`,
        { actual: context.request.path },
      ));
      context.stop();
      return;
    }

    const pathItem = context.specification.paths[match.specificationPath];
    context.operationModel = {
      specificationPath: match.specificationPath,
      method: context.request.method.toLowerCase(),
      operation: {},
      pathItem,
      parameters: [],
      pathParameters: match.pathParameters,
      allowedMethods: [],
    };
  }
}
