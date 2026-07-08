import { SpecificationLoader } from '../../domain/services/SpecificationLoader';

export class LoadSpecificationUseCase {
  constructor(private readonly specificationLoader: SpecificationLoader) {}

  public async execute(buffer: Buffer): Promise<object> {
    return this.specificationLoader.load(buffer);
  }
}
