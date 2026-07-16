import { createHash, randomUUID } from "crypto";
import path from "path";
import type { Pool } from "pg";
import type { SpecificationRepository } from "../../application/storage/SpecificationRepository";
import type { StoredSpecification } from "../../domain/specification/StoredSpecification";

interface SpecificationRow {
  id: string; name: string; version: string; file_name: string; stored_file_name: string;
  uploaded_at: Date | string; size: number | string; sha256: string; content: Buffer;
}

export class PostgresSpecificationRepository implements SpecificationRepository {
  private initialization?: Promise<void>;
  public constructor(private readonly pool: Pool) {}

  public async save(fileName: string, content: Buffer, name?: string, version?: string): Promise<StoredSpecification> {
    await this.initialize();
    const sha256 = createHash("sha256").update(content).digest("hex");
    const existing = await this.pool.query<SpecificationRow>("SELECT * FROM specifications WHERE sha256 = $1 LIMIT 1", [sha256]);
    if (existing.rowCount) {
      const row = existing.rows[0];
      const updatedName = this.normalize(name, row.name);
      const updatedVersion = this.normalize(version, row.version);
      const updated = await this.pool.query<SpecificationRow>(
        "UPDATE specifications SET name=$1, version=$2 WHERE id=$3 RETURNING *",
        [updatedName, updatedVersion, row.id],
      );
      return this.map(updated.rows[0]);
    }
    const id = randomUUID();
    const extension = [".yaml", ".yml", ".json"].includes(path.extname(fileName).toLowerCase()) ? path.extname(fileName).toLowerCase() : ".yaml";
    const inserted = await this.pool.query<SpecificationRow>(
      `INSERT INTO specifications (id,name,version,file_name,stored_file_name,uploaded_at,size,sha256,content)
       VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8) RETURNING *`,
      [id, this.normalize(name, path.parse(fileName).name), this.normalize(version, "unspecified"), path.basename(fileName), `${id}${extension}`, content.byteLength, sha256, content],
    );
    return this.map(inserted.rows[0]);
  }

  public async list(): Promise<StoredSpecification[]> {
    await this.initialize();
    const result = await this.pool.query<SpecificationRow>("SELECT * FROM specifications ORDER BY uploaded_at DESC");
    return result.rows.map((row) => this.map(row));
  }
  public async get(id: string): Promise<StoredSpecification | undefined> {
    await this.initialize();
    const result = await this.pool.query<SpecificationRow>("SELECT * FROM specifications WHERE id=$1", [id]);
    return result.rowCount ? this.map(result.rows[0]) : undefined;
  }
  public async readContent(id: string): Promise<Buffer | undefined> {
    await this.initialize();
    const result = await this.pool.query<{ content: Buffer }>("SELECT content FROM specifications WHERE id=$1", [id]);
    return result.rowCount ? result.rows[0].content : undefined;
  }
  public async delete(id: string): Promise<boolean> {
    await this.initialize();
    const result = await this.pool.query("DELETE FROM specifications WHERE id=$1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  private initialize(): Promise<void> {
    this.initialization ??= this.pool.query(`CREATE TABLE IF NOT EXISTS specifications (
      id UUID PRIMARY KEY, name VARCHAR(120) NOT NULL, version VARCHAR(120) NOT NULL,
      file_name TEXT NOT NULL, stored_file_name TEXT NOT NULL, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      size BIGINT NOT NULL, sha256 CHAR(64) NOT NULL UNIQUE, content BYTEA NOT NULL
    )`).then(() => undefined);
    return this.initialization;
  }
  private normalize(value: string | undefined, fallback: string): string { return value?.trim().slice(0, 120) || fallback; }
  private map(row: SpecificationRow): StoredSpecification {
    return { id: row.id, name: row.name, version: row.version, fileName: row.file_name, storedFileName: row.stored_file_name,
      uploadedAt: new Date(row.uploaded_at).toISOString(), size: Number(row.size), sha256: row.sha256 };
  }
}
