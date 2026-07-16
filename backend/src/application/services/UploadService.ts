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

  public getSpecification(request: Request): Specification {
    const file = request.file;

    if (file) {
      this.specificationStore.save(file.originalname, file.buffer);
      return {
        fileName: file.originalname,
        content: file.buffer.toString("utf8"),
      };
    }

    const specificationId = request.body?.specificationId;
    if (typeof specificationId === "string" && specificationId.trim()) {
      const metadata = this.specificationStore.get(specificationId);
      const content = this.specificationStore.readContent(specificationId);

      if (!metadata || !content) {
        throw new Error("Selected specification was not found");
      }

      return {
        fileName: metadata.fileName,
        content: content.toString("utf8"),
      };
    }

    throw new Error("Specification file or specificationId is required");
  }
}
