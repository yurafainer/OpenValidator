import type { ValidationMode } from "../domain/validation/ValidationMode";

export interface ValidationRequest {
  specification: string;
  method: string;
  path: string;
  validationMode?: ValidationMode;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  requestBody?: unknown;
  statusCode?: number;
  responseHeaders?: Record<string, unknown>;
  responseBody?: unknown;
}
