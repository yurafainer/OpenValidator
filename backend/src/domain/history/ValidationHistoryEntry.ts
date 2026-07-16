export interface ValidationHistoryEntry {
  id: string;
  createdAt: string;
  specificationId?: string;
  specificationName?: string;
  specificationVersion?: string;
  path: string;
  method: string;
  validationMode: string;
  valid: boolean;
  errorCount: number;
  result: unknown;
}
