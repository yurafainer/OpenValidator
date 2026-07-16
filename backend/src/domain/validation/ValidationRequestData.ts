export interface ValidationRequestData {
  path: string;
  method: string;
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
  body?: unknown;
}
