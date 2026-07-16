import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import type { ValidationHistoryRepository } from "../../application/storage/ValidationHistoryRepository";
import type { ValidationHistoryEntry } from "../../domain/history/ValidationHistoryEntry";

export class FileValidationHistoryRepository implements ValidationHistoryRepository {
  private readonly historyFile: string;
  public constructor(storageDirectory = path.resolve(process.cwd(), "data", "history")) {
    mkdirSync(storageDirectory, { recursive: true });
    this.historyFile = path.join(storageDirectory, "validation-history.json");
  }
  public async add(entry: Omit<ValidationHistoryEntry, "id" | "createdAt">): Promise<ValidationHistoryEntry> {
    const created = { ...entry, id: randomUUID(), createdAt: new Date().toISOString() };
    await this.write([created, ...(await this.list())].slice(0, 500));
    return created;
  }
  public async list(): Promise<ValidationHistoryEntry[]> {
    if (!existsSync(this.historyFile)) return [];
    try { const parsed = JSON.parse(readFileSync(this.historyFile, "utf8")); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  public async get(id: string): Promise<ValidationHistoryEntry | undefined> { return (await this.list()).find((entry) => entry.id === id); }
  public async clear(): Promise<void> { await this.write([]); }
  private async write(entries: ValidationHistoryEntry[]): Promise<void> { const temp = `${this.historyFile}.${randomUUID()}.tmp`; writeFileSync(temp, JSON.stringify(entries, null, 2)); renameSync(temp, this.historyFile); }
}
