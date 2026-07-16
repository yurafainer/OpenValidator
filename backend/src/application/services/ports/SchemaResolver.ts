export interface SchemaResolver {
    resolve(
        specification: any,
        path: string,
        method: string
    ): unknown;
}