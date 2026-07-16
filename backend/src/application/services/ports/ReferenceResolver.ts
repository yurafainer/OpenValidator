export interface ReferenceResolver {

    resolve(
        specification: any,
        schema: unknown
    ): unknown;

}