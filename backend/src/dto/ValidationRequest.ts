export interface ValidationRequest {
  specification: string;
  method: string;
  path: string;
  body?: unknown;
}