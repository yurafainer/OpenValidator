import { validateXML } from "xmllint-wasm";

import type {
  XmlSchemaValidationInput,
  XmlSchemaValidator,
} from "../../application/services/ports/XmlSchemaValidator";
import type {
  XmlValidationError,
  XmlValidationResult,
} from "../../domain/xml/XmlValidationResult";

export class DefaultXmlSchemaValidator implements XmlSchemaValidator {
  public async validate(
    input: XmlSchemaValidationInput,
  ): Promise<XmlValidationResult> {
    try {
      const result = await validateXML({
        xml: {
          fileName: input.xmlFileName ?? "document.xml",
          contents: input.xml,
        },
        schema: {
          fileName: input.schemaFileName,
          contents: input.xsd,
        },
        extension: "schema",
      });

      const errors: XmlValidationError[] = result.errors.map((issue) => ({
        code: this.resolveErrorCode(issue.message),
        severity: "ERROR",
        message: issue.message,
        path: issue.loc?.fileName ?? "xml",
        line: issue.loc?.lineNumber,
        category: "validation",
        stage: "xsd-validation",
      }));

      return this.createResult(input, errors);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "XML/XSD validation could not be completed";

      return this.createResult(input, [{
        code: this.resolveTechnicalErrorCode(message),
        severity: "ERROR",
        message,
        path: this.isSchemaError(message) ? "xsd" : "xml",
        category: this.isSchemaError(message) ? "schema" : "parse",
        stage: this.isSchemaError(message) ? "schema-parse" : "xml-parse",
      }]);
    }
  }

  private resolveErrorCode(message: string): string {
    if (/parser error|premature end|opening and ending tag mismatch/i.test(message)) {
      return "INVALID_XML_DOCUMENT";
    }

    return "XML_XSD_VALIDATION_ERROR";
  }

  private resolveTechnicalErrorCode(message: string): string {
    return this.isSchemaError(message)
      ? "INVALID_XSD_SCHEMA"
      : "INVALID_XML_DOCUMENT";
  }

  private isSchemaError(message: string): boolean {
    return /schema|xsd|Schemas parser error/i.test(message);
  }

  private createResult(
    input: XmlSchemaValidationInput,
    errors: XmlValidationError[],
  ): XmlValidationResult {
    const errorCount = errors.filter((error) => error.severity === "ERROR").length;
    const warningCount = errors.filter((error) => error.severity === "WARNING").length;
    const valid = errorCount === 0;

    return {
      valid,
      schemaFileName: input.schemaFileName,
      xmlFileName: input.xmlFileName,
      format: "XML_XSD",
      errorCount,
      warningCount,
      errors,
      message: valid ? "XML validation passed" : "XML validation failed",
    };
  }
}
