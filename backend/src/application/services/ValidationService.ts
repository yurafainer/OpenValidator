import { inject, injectable } from "tsyringe";
import YAML from "yaml";

import { Specification } from "../../domain/models/Specification";
import { JsonSchemaValidator } from "./ports/JsonSchemaValidator";
import { ReferenceResolver } from "./ports/ReferenceResolver";
import { RequestBodyResolver } from "./ports/RequestBodyResolver";
import { SchemaResolver } from "./ports/SchemaResolver";

@injectable()
export class ValidationService {
  constructor(
    @inject("SchemaResolver")
    private readonly schemaResolver: SchemaResolver,

    @inject("RequestBodyResolver")
    private readonly requestBodyResolver: RequestBodyResolver,

    @inject("ReferenceResolver")
    private readonly referenceResolver: ReferenceResolver,

    @inject("JsonSchemaValidator")
    private readonly jsonSchemaValidator: JsonSchemaValidator,
  ) {}

  public async validate(
    specification: Specification,
    path: string,
    method: string,
    requestBody?: unknown,
  ): Promise<object> {
    const parsedSpecification = YAML.parse(specification.content);

    if (!parsedSpecification || typeof parsedSpecification !== "object") {
      throw new Error("Invalid YAML specification");
    }

    const operation = this.schemaResolver.resolve(
      parsedSpecification,
      path,
      method,
    );

    const requestBodySchema =
      this.requestBodyResolver.resolve(operation);

    if (!requestBodySchema) {
      return {
        valid: true,
        fileName: specification.fileName,
        path,
        method: method.toUpperCase(),
        operationFound: true,
        requestBodySchemaFound: false,
        message: "Operation found and does not contain a request body schema",
      };
    }

    const resolvedSchema = this.referenceResolver.resolve(
      parsedSpecification,
      requestBodySchema,
    );

    const validationResult = this.jsonSchemaValidator.validate(
      resolvedSchema,
      requestBody,
    );

    return {
      valid: validationResult.valid,
      fileName: specification.fileName,
      path,
      method: method.toUpperCase(),
      operationFound: true,
      requestBodySchemaFound: true,
      referencesResolved: true,
      errors: validationResult.errors,
      message: validationResult.valid
        ? "Request body is valid"
        : "Request body validation failed",
    };
  }
}