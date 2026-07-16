import type { Request, Response } from "express";
import { SpecificationComparisonService } from "../../application/compare/SpecificationComparisonService";

export class ComparisonController {
  constructor(private readonly service = new SpecificationComparisonService()) {}
  public compare = (req: Request, res: Response): void => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const oldFile = files?.oldFile?.[0];
    const newFile = files?.newFile?.[0];
    if (!oldFile || !newFile) { res.status(400).json({ message: "oldFile and newFile are required" }); return; }
    const result = this.service.compare(oldFile.buffer.toString("utf8"), newFile.buffer.toString("utf8"));
    res.json({ oldFileName: oldFile.originalname, newFileName: newFile.originalname, ...result });
  };
}
