import type { SpecificationLoader } from "../../application/services/ports/SpecificationLoader";

export class LoadSpecificationUseCase {
  constructor(private readonly specificationLoader: SpecificationLoader) {}

  public async execute(buffer: Buffer): Promise<object> {
    return this.specificationLoader.load(buffer);
  }
}
