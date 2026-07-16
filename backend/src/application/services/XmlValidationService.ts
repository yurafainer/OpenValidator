import { inject, injectable } from "tsyringe";

import type { XmlSchemaValidator } from "./ports/XmlSchemaValidator";
import type { XmlValidationResult } from "../../domain/xml/XmlValidationResult";

export interface XmlValidationRequest {
  xsd: string;
  xml: string;
  schemaFileName: string;
  xmlFileName?: string;
}

@injectable()
export class XmlValidationService {
  constructor(
    @inject("XmlSchemaValidator")
    private readonly xmlSchemaValidator: XmlSchemaValidator,
  ) {}

  public validate(request: XmlValidationRequest): Promise<XmlValidationResult> {
    return this.xmlSchemaValidator.validate(request);
  }
}
