import { Request } from "express";
import { inject, injectable } from "tsyringe";

import { SpecificationStore } from "../specifications/SpecificationStore";
import { Specification } from "../../domain/models/Specification";

@injectable()
export class UploadService {
  public constructor(
    @inject(SpecificationStore)
    private readonly specificationStore: SpecificationStore,
  ) {}

  public async getSpecification(request: Request): Promise<Specification> {
    const file = request.file;

    if (file) {
      await this.specificationStore.save(file.originalname, file.buffer);
      return {
        fileName: file.originalname,
        content: file.buffer.toString("utf8"),
      };
    }

    const pastedContent = request.body?.specificationContent;
    if (typeof pastedContent === "string" && pastedContent.trim()) {
      const name = typeof request.body?.specificationName === "string" ? request.body.specificationName.trim() : "";
      const fileName = typeof request.body?.specificationFileName === "string" && request.body.specificationFileName.trim()
        ? request.body.specificationFileName.trim()
        : `${name || "pasted-specification"}.yaml`;
      const content = Buffer.from(pastedContent.trim(), "utf8");
      await this.specificationStore.save(
        fileName,
        content,
        name || undefined,
        typeof request.body?.specificationVersion === "string" ? request.body.specificationVersion : undefined,
      );
      return {
        fileName,
        content: content.toString("utf8"),
      };
    }

    const specificationId = request.body?.specificationId;
    if (typeof specificationId === "string" && specificationId.trim()) {
      const metadata = await this.specificationStore.get(specificationId);
      const content = await this.specificationStore.readContent(specificationId);

      if (!metadata || !content) {
        throw new Error("Selected specification was not found");
      }

      return {
        fileName: metadata.fileName,
        content: content.toString("utf8"),
      };
    }

    throw new Error("Specification file, pasted content, or specificationId is required");
  }
}
