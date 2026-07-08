
export interface SpecificationLoader {
  load(buffer: Buffer): Promise<object>;
}

