import { injectable } from "tsyringe";

import { RequestBodyResolver } from "../../application/services/ports/RequestBodyResolver";

@injectable()
export class OpenApiRequestBodyResolver
    implements RequestBodyResolver {

    public resolve(operation: any): unknown {

        return operation?.requestBody
            ?.content?.["application/json"]
            ?.schema;
    }

}