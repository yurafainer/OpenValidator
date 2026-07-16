import { container } from "./DependencyContainer";

import { ILogger } from "../../common/logger/ILogger";
import { LoggerService } from "../../common/logger/LoggerService";
import { JsonSchemaValidator } from "../../application/services/ports/JsonSchemaValidator";
import { ReferenceResolver } from "../../application/services/ports/ReferenceResolver";
import { RequestBodyResolver } from "../../application/services/ports/RequestBodyResolver";
import { SchemaResolver } from "../../application/services/ports/SchemaResolver";
import { SpecificationLoader } from "../../application/services/ports/SpecificationLoader";
import { SpecificationValidator } from "../../application/services/ports/SpecificationValidator";
import { XmlSchemaValidator } from "../../application/services/ports/XmlSchemaValidator";
import { SpecificationStore } from "../../application/specifications/SpecificationStore";
import { ValidationHistoryStore } from "../../application/history/ValidationHistoryStore";
import { ExampleGenerationService } from "../../application/examples/ExampleGenerationService";
import type { MethodValidator } from "../../domain/validation/MethodValidator";
import type { ParameterValidator } from "../../domain/validation/ParameterValidator";
import type { PathMatcher } from "../../domain/validation/PathMatcher";
import { OpenApiReferenceResolver } from "../openapi/OpenApiReferenceResolver";
import { OpenApiRequestBodyResolver } from "../openapi/OpenApiRequestBodyResolver";
import { OpenApiSchemaResolver } from "../openapi/OpenApiSchemaResolver";
import { YamlSpecificationLoader } from "../parser/YamlSpecificationLoader";
import { AjvJsonSchemaValidator } from "../validation/AjvJsonSchemaValidator";
import { DefaultMethodValidator } from "../validation/DefaultMethodValidator";
import { DefaultParameterValidator } from "../validation/DefaultParameterValidator";
import { DefaultPathMatcher } from "../validation/DefaultPathMatcher";
import { DefaultSpecificationValidator } from "../validation/DefaultSpecificationValidator";
import { DefaultXmlSchemaValidator } from "../xml/DefaultXmlSchemaValidator";
import { createStorageStores } from "../storage/createStorageStores";

export function registerDependencies(): void {
  const stores = createStorageStores();
  container.registerInstance(SpecificationStore, stores.specificationStore);
  container.registerInstance(ValidationHistoryStore, stores.historyStore);
  container.registerInstance("StorageProvider", stores.provider);
  container.registerSingleton(ExampleGenerationService, ExampleGenerationService);
  container.registerSingleton<ILogger>("ILogger", LoggerService);
  container.registerSingleton<SpecificationLoader>("SpecificationLoader", YamlSpecificationLoader);
  container.registerSingleton<SpecificationValidator>("SpecificationValidator", DefaultSpecificationValidator);
  container.registerSingleton<SchemaResolver>("SchemaResolver", OpenApiSchemaResolver);
  container.registerSingleton<RequestBodyResolver>("RequestBodyResolver", OpenApiRequestBodyResolver);
  container.registerSingleton<JsonSchemaValidator>("JsonSchemaValidator", AjvJsonSchemaValidator);
  container.registerSingleton<ReferenceResolver>("ReferenceResolver", OpenApiReferenceResolver);
  container.registerSingleton<PathMatcher>("PathMatcher", DefaultPathMatcher);
  container.registerSingleton<MethodValidator>("MethodValidator", DefaultMethodValidator);
  container.registerSingleton<ParameterValidator>("ParameterValidator", DefaultParameterValidator);
  container.registerSingleton<XmlSchemaValidator>("XmlSchemaValidator", DefaultXmlSchemaValidator);
}
