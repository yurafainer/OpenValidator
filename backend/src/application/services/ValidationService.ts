import { inject, injectable } from "tsyringe";
import YAML from "yaml";

import { Specification } from "../../domain/models/Specification";
import type { OpenApiSpecificationDocument } from "../../domain/openapi/OpenApiSpecificationDocument";
import type { MethodValidator } from "../../domain/validation/MethodValidator";
import type { ParameterValidator } from "../../domain/validation/ParameterValidator";
import type { PathMatcher } from "../../domain/validation/PathMatcher";
import { ValidationContext } from "../../domain/validation/ValidationContext";
import type { ValidationRequestData } from "../../domain/validation/ValidationRequestData";
import type { ValidationResponseData } from "../../domain/validation/ValidationResponseData";
import { ValidationMode } from "../../domain/validation/ValidationMode";
import { RequestValidationPipeline } from "../validation/RequestValidationPipeline";
import { BodyValidationStep } from "../validation/steps/BodyValidationStep";
import { MethodValidationStep } from "../validation/steps/MethodValidationStep";
import { ParameterValidationStep } from "../validation/steps/ParameterValidationStep";
import { PathValidationStep } from "../validation/steps/PathValidationStep";
import { ResponseValidationStep } from "../validation/steps/ResponseValidationStep";
import { JsonSchemaValidator } from "./ports/JsonSchemaValidator";
import { ReferenceResolver } from "./ports/ReferenceResolver";
import { RequestBodyResolver } from "./ports/RequestBodyResolver";

interface RequestData {
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  response?: Partial<ValidationResponseData>;
  validationMode?: ValidationMode;
}

@injectable()
export class ValidationService {
  private readonly pipeline: RequestValidationPipeline;

  constructor(
    @inject("RequestBodyResolver") requestBodyResolver: RequestBodyResolver,
    @inject("ReferenceResolver") referenceResolver: ReferenceResolver,
    @inject("JsonSchemaValidator") jsonSchemaValidator: JsonSchemaValidator,
    @inject("PathMatcher") pathMatcher: PathMatcher,
    @inject("MethodValidator") methodValidator: MethodValidator,
    @inject("ParameterValidator") parameterValidator: ParameterValidator,
  ) {
    this.pipeline = new RequestValidationPipeline([
      new PathValidationStep(pathMatcher),
      new MethodValidationStep(methodValidator),
      new ParameterValidationStep(referenceResolver, parameterValidator),
      new BodyValidationStep(requestBodyResolver, referenceResolver, jsonSchemaValidator),
      new ResponseValidationStep(referenceResolver, jsonSchemaValidator),
    ]);
  }

  public async validate(
    specification: Specification,
    requestPath: string,
    requestMethod: string,
    requestData: RequestData = {},
  ): Promise<object> {
    const parsedSpecification = this.parseSpecification(specification.content);
    const request: ValidationRequestData = {
      path: requestPath,
      method: requestMethod,
      headers: requestData.headers ?? {},
      query: requestData.query ?? {},
      body: requestData.body,
    };
    const mode = requestData.validationMode ?? ValidationMode.REQUEST;
    const response = requestData.response?.statusCode !== undefined
      ? {
          statusCode: requestData.response.statusCode,
          headers: requestData.response.headers ?? {},
          body: requestData.response.body,
        }
      : undefined;
    const context = new ValidationContext(
      specification.fileName,
      parsedSpecification,
      request,
      response,
      { mode },
    );

    await this.pipeline.execute(context);
    return this.createResult(context);
  }

  private parseSpecification(content: string): OpenApiSpecificationDocument {
    const parsed = YAML.parse(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid YAML specification");
    }

    if (!parsed.paths || typeof parsed.paths !== "object" || Array.isArray(parsed.paths)) {
      throw new Error("Specification does not contain paths");
    }

    return parsed as OpenApiSpecificationDocument;
  }

  private createResult(context: ValidationContext): object {
    const model = context.operationModel;
    const pathFound = Boolean(model);
    const operationFound = Boolean(model?.operation && Object.keys(model.operation).length > 0);

    return {
      valid: context.valid,
      fileName: context.fileName,
      path: model?.specificationPath ?? context.request.path,
      method: context.request.method.toUpperCase(),
      operationFound,
      pathParameters: model?.pathParameters ?? {},
      allowedMethods: model?.allowedMethods ?? [],
      validationMode: context.options.mode,
      requestBodySchemaFound: context.requestBodySchemaFound,
      responseBodySchemaFound: context.responseBodySchemaFound,
      responseStatusCode: context.response?.statusCode,
      pipeline: this.pipeline.stepNames,
      errors: context.errors,
      message: context.valid ? "Validation passed" : "Validation failed",
      metadata: {
        pathFound,
        specificationVersion:
          context.specification.openapi ?? context.specification.swagger ?? "unknown",
      },
    };
  }
}
