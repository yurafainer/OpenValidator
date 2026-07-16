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
      if (!req.file) {
        res.status(400).json({ message: "Specification file is required" });
        return;
      }

      const specification = await this.loadSpecificationUseCase.execute(req.file.buffer);
      const name = typeof req.body?.specificationName === "string" ? req.body.specificationName : undefined;
      const version = typeof req.body?.specificationVersion === "string" ? req.body.specificationVersion : undefined;
      const storedSpecification = this.specificationStore.save(
        req.file.originalname,
        req.file.buffer,
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
      specifications: this.specificationStore.list(),
    });
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const metadata = this.specificationStore.get(id);
      const content = this.specificationStore.readContent(id);

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
    if (!this.specificationStore.delete(id)) {
      res.status(404).json({ message: "Stored specification was not found" });
      return;
    }

    res.status(204).send();
  };
}
