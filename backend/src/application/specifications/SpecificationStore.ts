import type { SpecificationRepository } from "../storage/SpecificationRepository";
import type { StoredSpecification } from "../../domain/specification/StoredSpecification";

export class SpecificationStore {
  public constructor(private readonly repository: SpecificationRepository) {}
  public save(fileName: string, content: Buffer, name?: string, version?: string): Promise<StoredSpecification> { return this.repository.save(fileName, content, name, version); }
  public list(): Promise<StoredSpecification[]> { return this.repository.list(); }
  public get(id: string): Promise<StoredSpecification | undefined> { return this.repository.get(id); }
  public readContent(id: string): Promise<Buffer | undefined> { return this.repository.readContent(id); }
  public delete(id: string): Promise<boolean> { return this.repository.delete(id); }
}
