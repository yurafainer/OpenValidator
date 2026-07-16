export interface OpenApiOperation extends Record<string, unknown> {
  operationId?: string;
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
}
