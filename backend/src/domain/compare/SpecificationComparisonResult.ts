export interface SpecificationChange {
  type: "ADDED" | "REMOVED" | "CHANGED";
  category: "PATH" | "METHOD" | "SCHEMA";
  location: string;
  breaking: boolean;
  message: string;
}

export interface SpecificationComparisonResult {
  compatible: boolean;
  compatibilityScore: number;
  summary: {
    added: number;
    removed: number;
    changed: number;
    breaking: number;
  };
  changes: SpecificationChange[];
}
