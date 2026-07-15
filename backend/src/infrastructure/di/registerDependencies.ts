import { container } from "./DependencyContainer";

import { ILogger } from "../../common/logger/ILogger";
import { LoggerService } from "../../common/logger/LoggerService";

import { SpecificationLoader } from "../../application/services/ports/SpecificationLoader";
import { SpecificationValidator } from "../../application/services/ports/SpecificationValidator";
import { SchemaResolver } from "../../application/services/ports/SchemaResolver";

import { YamlSpecificationLoader } from "../parser/YamlSpecificationLoader";
import { DefaultSpecificationValidator } from "../validation/DefaultSpecificationValidator";
import { OpenApiSchemaResolver } from "../openapi/OpenApiSchemaResolver";
import { RequestBodyResolver } from "../../application/services/ports/RequestBodyResolver";
import { OpenApiRequestBodyResolver } from "../openapi/OpenApiRequestBodyResolver";
import { JsonSchemaValidator } from "../../application/services/ports/JsonSchemaValidator";
import { AjvJsonSchemaValidator } from "../validation/AjvJsonSchemaValidator";

export function registerDependencies(): void {

container.registerSingleton<RequestBodyResolver>(
    "RequestBodyResolver",
    OpenApiRequestBodyResolver
);
container.registerSingleton<JsonSchemaValidator>(
  "JsonSchemaValidator",
  AjvJsonSchemaValidator,
);
    container.registerSingleton<ILogger>(
        "ILogger",
        LoggerService
    );

    container.registerSingleton<SpecificationLoader>(
        "SpecificationLoader",
        YamlSpecificationLoader
    );

    container.registerSingleton<SpecificationValidator>(
        "SpecificationValidator",
        DefaultSpecificationValidator
    );

    container.registerSingleton<SchemaResolver>(
        "SchemaResolver",
        OpenApiSchemaResolver
    );
    container.registerSingleton<RequestBodyResolver>(
  "RequestBodyResolver",
  OpenApiRequestBodyResolver,
);
}