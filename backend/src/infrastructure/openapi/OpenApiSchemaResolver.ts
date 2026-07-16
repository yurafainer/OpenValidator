import { injectable } from "tsyringe";

import { SchemaResolver } from "../../application/services/ports/SchemaResolver";

@injectable()
export class OpenApiSchemaResolver implements SchemaResolver {

    public resolve(
        specification: any,
        path: string,
        method: string
    ): unknown {

        const operation =
            specification?.paths?.[path]?.[method.toLowerCase()];

        if (!operation) {
            throw new Error(
                `Operation '${method.toUpperCase()} ${path}' not found`
            );
        }

        return operation;
    }

}