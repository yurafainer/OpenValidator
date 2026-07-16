import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { injectable } from "tsyringe";

import type { StoredSpecification } from "../../domain/specification/StoredSpecification";

@injectable()
export class SpecificationStore {
  private readonly storageDirectory: string;

  public constructor(storageDirectory?: string) {
    this.storageDirectory = storageDirectory ?? path.resolve(process.cwd(), "data", "specifications");
    mkdirSync(this.storageDirectory, { recursive: true });
  }

  public save(fileName: string, content: Buffer, name?: string, version?: string): StoredSpecification {
    const sha256 = createHash("sha256").update(content).digest("hex");
    const existing = this.list().find((item) => item.sha256 === sha256);

    if (existing) {
      const updated: StoredSpecification = {
        ...existing,
        name: this.normalizeDisplayValue(name, existing.name),
        version: this.normalizeDisplayValue(version, existing.version),
      };

      if (updated.name !== existing.name || updated.version !== existing.version) {
        this.atomicWrite(
          path.join(this.storageDirectory, `${existing.id}.metadata.json`),
          Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
        );
      }

      return updated;
    }

    const id = randomUUID();
    const extension = this.getAllowedExtension(fileName);
    const storedFileName = `${id}${extension}`;
    const metadata: StoredSpecification = {
      id,
      name: this.normalizeDisplayValue(name, path.parse(fileName).name),
      version: this.normalizeDisplayValue(version, "unspecified"),
      fileName: path.basename(fileName),
      storedFileName,
      uploadedAt: new Date().toISOString(),
      size: content.byteLength,
      sha256,
    };

    this.atomicWrite(path.join(this.storageDirectory, storedFileName), content);
    this.atomicWrite(
      path.join(this.storageDirectory, `${id}.metadata.json`),
      Buffer.from(JSON.stringify(metadata, null, 2), "utf8"),
    );

    return metadata;
  }

  public list(): StoredSpecification[] {
    if (!existsSync(this.storageDirectory)) return [];

    return readdirSync(this.storageDirectory)
      .filter((fileName) => fileName.endsWith(".metadata.json"))
      .map((fileName) => this.readMetadata(path.join(this.storageDirectory, fileName)))
      .filter((item): item is StoredSpecification => item !== undefined)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
  }

  public get(id: string): StoredSpecification | undefined {
    if (!this.isValidId(id)) return undefined;
    return this.readMetadata(path.join(this.storageDirectory, `${id}.metadata.json`));
  }

  public readContent(id: string): Buffer | undefined {
    const metadata = this.get(id);
    if (!metadata) return undefined;

    const filePath = path.join(this.storageDirectory, metadata.storedFileName);
    if (!existsSync(filePath)) return undefined;
    return readFileSync(filePath);
  }

  public delete(id: string): boolean {
    const metadata = this.get(id);
    if (!metadata) return false;

    rmSync(path.join(this.storageDirectory, metadata.storedFileName), { force: true });
    rmSync(path.join(this.storageDirectory, `${id}.metadata.json`), { force: true });
    return true;
  }

  private atomicWrite(targetPath: string, content: Buffer): void {
    const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;
    writeFileSync(temporaryPath, content);
    renameSync(temporaryPath, targetPath);
  }

  private readMetadata(filePath: string): StoredSpecification | undefined {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<StoredSpecification>;
      if (!parsed?.id || !parsed?.storedFileName) return undefined;

      return {
        ...parsed,
        name: parsed.name?.trim() || path.parse(parsed.fileName || parsed.storedFileName).name,
        version: parsed.version?.trim() || "unspecified",
      } as StoredSpecification;
    } catch {
      return undefined;
    }
  }

  private normalizeDisplayValue(value: string | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized ? normalized.slice(0, 120) : fallback;
  }

  private getAllowedExtension(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    return [".yaml", ".yml", ".json"].includes(extension) ? extension : ".yaml";
  }

  private isValidId(id: string): boolean {
    return /^[0-9a-f-]{36}$/i.test(id);
  }
}
