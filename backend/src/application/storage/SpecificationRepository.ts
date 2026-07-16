import type { StoredSpecification } from "../../domain/specification/StoredSpecification";

export interface SpecificationRepository {
  save(fileName: string, content: Buffer, name?: string, version?: string): Promise<StoredSpecification>;
  list(): Promise<StoredSpecification[]>;
  get(id: string): Promise<StoredSpecification | undefined>;
  readContent(id: string): Promise<Buffer | undefined>;
  delete(id: string): Promise<boolean>;
}
