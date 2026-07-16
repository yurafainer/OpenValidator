import type { XmlValidationResult } from "../../../domain/xml/XmlValidationResult";

export interface XmlSchemaValidationInput {
  xsd: string;
  xml: string;
  schemaFileName: string;
  xmlFileName?: string;
}

export interface XmlSchemaValidator {
  validate(input: XmlSchemaValidationInput): Promise<XmlValidationResult>;
}
