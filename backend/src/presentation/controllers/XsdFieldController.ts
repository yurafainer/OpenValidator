import type { Request, Response } from "express";
import { injectable } from "tsyringe";

import { XsdFieldExtractionService } from "../../application/xsd/XsdFieldExtractionService";

@injectable()
export class XsdFieldController {
  constructor(private readonly extractionService: XsdFieldExtractionService) {}

  extract = async (req: Request, res: Response): Promise<void> => {
    const xsdFile = req.file;
    const pastedXsd = typeof req.body?.xsd === "string" ? req.body.xsd.trim() : "";

    if (!xsdFile && !pastedXsd) {
      res.status(400).json({ message: "XSD is required. Upload 'xsdFile' or provide text in field 'xsd'" });
      return;
    }

    try {
      const result = this.extractionService.extract(
        xsdFile?.buffer.toString("utf8") ?? pastedXsd,
        xsdFile?.originalname ?? "schema.xsd",
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to read XSD",
      });
    }
  };
}
