export interface XmlValidationError {
  code: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  path: string;
  line?: number;
  column?: number;
  category?: string;
  stage?: string;
}

export interface XmlValidationResult {
  valid: boolean;
  schemaFileName: string;
  xmlFileName?: string;
  format: "XML_XSD";
  errorCount: number;
  warningCount: number;
  errors: XmlValidationError[];
  message: string;
}
