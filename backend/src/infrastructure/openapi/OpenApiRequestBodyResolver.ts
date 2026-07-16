import { injectable } from "tsyringe";

import { RequestBodyResolver } from "../../application/services/ports/RequestBodyResolver";

@injectable()
export class OpenApiRequestBodyResolver
  implements RequestBodyResolver {

  public resolve(operation: any): unknown {
    // OpenAPI 3.x
    const openApi3Schema =
      operation?.requestBody
        ?.content?.["application/json"]
        ?.schema;

    if (openApi3Schema) {
      return openApi3Schema;
    }

    // Swagger 2.0
    const bodyParameter = operation?.parameters?.find(
      (parameter: any) => parameter?.in === "body",
    );

    return bodyParameter?.schema;
  }
}