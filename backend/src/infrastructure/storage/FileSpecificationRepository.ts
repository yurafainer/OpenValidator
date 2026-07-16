import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import path from "path";
import type { SpecificationRepository } from "../../application/storage/SpecificationRepository";
import type { StoredSpecification } from "../../domain/specification/StoredSpecification";

export class FileSpecificationRepository implements SpecificationRepository {
  public constructor(private readonly storageDirectory = path.resolve(process.cwd(), "data", "specifications")) {
    mkdirSync(this.storageDirectory, { recursive: true });
  }

  public async save(fileName: string, content: Buffer, name?: string, version?: string): Promise<StoredSpecification> {
    const sha256 = createHash("sha256").update(content).digest("hex");
    const existing = (await this.list()).find((item) => item.sha256 === sha256);
    if (existing) {
      const updated = { ...existing, name: this.normalize(name, existing.name), version: this.normalize(version, existing.version) };
      this.atomicWrite(path.join(this.storageDirectory, `${existing.id}.metadata.json`), Buffer.from(JSON.stringify(updated, null, 2)));
      return updated;
    }
    const id = randomUUID();
    const extension = [".yaml", ".yml", ".json"].includes(path.extname(fileName).toLowerCase()) ? path.extname(fileName).toLowerCase() : ".yaml";
    const storedFileName = `${id}${extension}`;
    const metadata: StoredSpecification = {
      id,
      name: this.normalize(name, path.parse(fileName).name),
      version: this.normalize(version, "unspecified"),
      fileName: path.basename(fileName),
      storedFileName,
      uploadedAt: new Date().toISOString(),
      size: content.byteLength,
      sha256,
    };
    this.atomicWrite(path.join(this.storageDirectory, storedFileName), content);
    this.atomicWrite(path.join(this.storageDirectory, `${id}.metadata.json`), Buffer.from(JSON.stringify(metadata, null, 2)));
    return metadata;
  }

  public async list(): Promise<StoredSpecification[]> {
    if (!existsSync(this.storageDirectory)) return [];
    return readdirSync(this.storageDirectory)
      .filter((name) => name.endsWith(".metadata.json"))
      .map((name) => this.readMetadata(path.join(this.storageDirectory, name)))
      .filter((item): item is StoredSpecification => Boolean(item))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  public async get(id: string): Promise<StoredSpecification | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    return this.readMetadata(path.join(this.storageDirectory, `${id}.metadata.json`));
  }

  public async readContent(id: string): Promise<Buffer | undefined> {
    const metadata = await this.get(id);
    if (!metadata) return undefined;
    const filePath = path.join(this.storageDirectory, metadata.storedFileName);
    return existsSync(filePath) ? readFileSync(filePath) : undefined;
  }

  public async delete(id: string): Promise<boolean> {
    const metadata = await this.get(id);
    if (!metadata) return false;
    rmSync(path.join(this.storageDirectory, metadata.storedFileName), { force: true });
    rmSync(path.join(this.storageDirectory, `${id}.metadata.json`), { force: true });
    return true;
  }

  private normalize(value: string | undefined, fallback: string): string { return value?.trim().slice(0, 120) || fallback; }
  private atomicWrite(target: string, content: Buffer): void { const temp = `${target}.${randomUUID()}.tmp`; writeFileSync(temp, content); renameSync(temp, target); }
  private readMetadata(filePath: string): StoredSpecification | undefined {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as StoredSpecification;
      return parsed?.id && parsed?.storedFileName ? { ...parsed, name: parsed.name?.trim() || path.parse(parsed.fileName).name, version: parsed.version?.trim() || "unspecified" } : undefined;
    } catch { return undefined; }
  }
}
