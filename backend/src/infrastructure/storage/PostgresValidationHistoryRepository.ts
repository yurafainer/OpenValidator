import { randomUUID } from "crypto";
import type { Pool } from "pg";
import type { ValidationHistoryRepository } from "../../application/storage/ValidationHistoryRepository";
import type { ValidationHistoryEntry } from "../../domain/history/ValidationHistoryEntry";

interface HistoryRow {
  id: string; created_at: Date | string; specification_id?: string; specification_name?: string; specification_version?: string;
  path: string; method: string; validation_mode: string; valid: boolean; error_count: number; result: unknown;
}

export class PostgresValidationHistoryRepository implements ValidationHistoryRepository {
  private initialization?: Promise<void>;
  public constructor(private readonly pool: Pool) {}
  public async add(entry: Omit<ValidationHistoryEntry, "id" | "createdAt">): Promise<ValidationHistoryEntry> {
    await this.initialize();
    const id = randomUUID();
    const result = await this.pool.query<HistoryRow>(
      `INSERT INTO validation_history (id,specification_id,specification_name,specification_version,path,method,validation_mode,valid,error_count,result)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, entry.specificationId ?? null, entry.specificationName ?? null, entry.specificationVersion ?? null, entry.path, entry.method, entry.validationMode, entry.valid, entry.errorCount, JSON.stringify(entry.result)],
    );
    await this.pool.query(`DELETE FROM validation_history WHERE id IN (
      SELECT id FROM validation_history ORDER BY created_at DESC OFFSET 500
    )`);
    return this.map(result.rows[0]);
  }
  public async list(): Promise<ValidationHistoryEntry[]> {
    await this.initialize();
    const result = await this.pool.query<HistoryRow>("SELECT * FROM validation_history ORDER BY created_at DESC LIMIT 500");
    return result.rows.map((row) => this.map(row));
  }
  public async get(id: string): Promise<ValidationHistoryEntry | undefined> {
    await this.initialize();
    const result = await this.pool.query<HistoryRow>("SELECT * FROM validation_history WHERE id=$1", [id]);
    return result.rowCount ? this.map(result.rows[0]) : undefined;
  }
  public async clear(): Promise<void> { await this.initialize(); await this.pool.query("TRUNCATE TABLE validation_history"); }
  private initialize(): Promise<void> {
    this.initialization ??= this.pool.query(`CREATE TABLE IF NOT EXISTS validation_history (
      id UUID PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), specification_id UUID NULL,
      specification_name VARCHAR(120), specification_version VARCHAR(120), path TEXT NOT NULL, method VARCHAR(16) NOT NULL,
      validation_mode VARCHAR(32) NOT NULL, valid BOOLEAN NOT NULL, error_count INTEGER NOT NULL, result JSONB NOT NULL
    )`).then(() => undefined);
    return this.initialization;
  }
  private map(row: HistoryRow): ValidationHistoryEntry {
    return { id: row.id, createdAt: new Date(row.created_at).toISOString(), specificationId: row.specification_id,
      specificationName: row.specification_name, specificationVersion: row.specification_version, path: row.path,
      method: row.method, validationMode: row.validation_mode, valid: row.valid, errorCount: Number(row.error_count), result: row.result };
  }
}
