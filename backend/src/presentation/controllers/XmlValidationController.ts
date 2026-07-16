import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { XmlValidationService } from "../../application/services/XmlValidationService";

interface XmlUploadFiles {
  xsdFile?: Express.Multer.File[];
  xmlFile?: Express.Multer.File[];
}

@injectable()
export class XmlValidationController {
  constructor(
    @inject(XmlValidationService)
    private readonly xmlValidationService: XmlValidationService,
  ) {}

  validate = async (req: Request, res: Response): Promise<void> => {
    const files = (req.files ?? {}) as XmlUploadFiles;
    const xsdFile = files.xsdFile?.[0];
    const xmlFile = files.xmlFile?.[0];

    if (!xsdFile) {
      res.status(400).json({ message: "XSD file is required in field 'xsdFile'" });
      return;
    }

    const xmlText = xmlFile?.buffer.toString("utf8")
      ?? this.readTextField(req.body.xml, "xml");

    if (!xmlText) {
      res.status(400).json({
        message: "XML is required. Upload 'xmlFile' or provide XML text in field 'xml'",
      });
      return;
    }

    const result = await this.xmlValidationService.validate({
      xsd: xsdFile.buffer.toString("utf8"),
      xml: xmlText,
      schemaFileName: xsdFile.originalname,
      xmlFileName: xmlFile?.originalname,
    });

    res.status(result.valid ? 200 : 422).json(result);
  };

  private readTextField(value: unknown, fieldName: string): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string") {
      throw new Error(`${fieldName} must be a text field`);
    }
    return value;
  }
}
