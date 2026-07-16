import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ExampleGenerationService } from "../../application/examples/ExampleGenerationService";
import { SpecificationStore } from "../../application/specifications/SpecificationStore";

@injectable()
export class ExampleController {
  public constructor(
    @inject(SpecificationStore) private readonly specificationStore: SpecificationStore,
    @inject(ExampleGenerationService) private readonly examples: ExampleGenerationService,
  ) {}

  public generate = async (req: Request, res: Response): Promise<void> => {
    const { specificationId, path, method, statusCode } = req.body ?? {};
    if (typeof specificationId !== "string" || !specificationId) { res.status(400).json({ message: "specificationId is required" }); return; }
    if (typeof path !== "string" || !path) { res.status(400).json({ message: "path is required" }); return; }
    if (typeof method !== "string" || !method) { res.status(400).json({ message: "method is required" }); return; }
    const content = await this.specificationStore.readContent(specificationId);
    if (!content) { res.status(404).json({ message: "Stored specification was not found" }); return; }
    try {
      res.json({ success: true, example: this.examples.generate({ content: content.toString("utf8"), path, method, statusCode }) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Example generation failed" });
    }
  };
}
