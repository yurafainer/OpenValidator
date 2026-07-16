import { Request, Response } from "express";

import { SpecificationStore } from "../../application/specifications/SpecificationStore";
import { LoadSpecificationUseCase } from "../../application/usecases/LoadSpecificationUseCase";

export class SpecificationController {
  public constructor(
    private readonly loadSpecificationUseCase: LoadSpecificationUseCase,
    private readonly specificationStore: SpecificationStore,
  ) {}

  public load = async (req: Request, res: Response): Promise<void> => {
    try {
      const pastedContent = typeof req.body?.specificationContent === "string"
        ? req.body.specificationContent.trim()
        : "";
      const content = req.file?.buffer ?? (pastedContent ? Buffer.from(pastedContent, "utf8") : undefined);

      if (!content) {
        res.status(400).json({ message: "Specification file or pasted content is required" });
        return;
      }

      const specification = await this.loadSpecificationUseCase.execute(content);
      const name = typeof req.body?.specificationName === "string" ? req.body.specificationName : undefined;
      const version = typeof req.body?.specificationVersion === "string" ? req.body.specificationVersion : undefined;
      const requestedFileName = typeof req.body?.specificationFileName === "string"
        ? req.body.specificationFileName.trim()
        : "";
      const fileName = req.file?.originalname || requestedFileName || `${name?.trim() || "pasted-specification"}.yaml`;
      const storedSpecification = await this.specificationStore.save(
        fileName,
        content,
        name,
        version,
      );

      res.status(200).json({
        success: true,
        storedSpecification,
        specification,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  public list = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      specifications: await this.specificationStore.list(),
    });
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const metadata = await this.specificationStore.get(id);
      const content = await this.specificationStore.readContent(id);

      if (!metadata || !content) {
        res.status(404).json({ message: "Stored specification was not found" });
        return;
      }

      const specification = await this.loadSpecificationUseCase.execute(content);
      res.status(200).json({ success: true, storedSpecification: metadata, specification });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  public remove = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!(await this.specificationStore.delete(id))) {
      res.status(404).json({ message: "Stored specification was not found" });
      return;
    }

    res.status(204).send();
  };
}
