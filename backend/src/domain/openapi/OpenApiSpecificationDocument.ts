export interface OpenApiSpecificationDocument extends Record<string, unknown> {
  swagger?: string;
  openapi?: string;
  paths: Record<string, Record<string, unknown>>;
}
