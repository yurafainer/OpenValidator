import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { injectable } from "tsyringe";
import type { ValidationHistoryEntry } from "../../domain/history/ValidationHistoryEntry";

@injectable()
export class ValidationHistoryStore {
  private readonly storageDirectory: string;
  private readonly historyFile: string;

  public constructor(storageDirectory?: string) {
    this.storageDirectory = storageDirectory ?? path.resolve(process.cwd(), "data", "history");
    this.historyFile = path.join(this.storageDirectory, "validation-history.json");
    mkdirSync(this.storageDirectory, { recursive: true });
  }

  public add(entry: Omit<ValidationHistoryEntry, "id" | "createdAt">): ValidationHistoryEntry {
    const created: ValidationHistoryEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const entries = [created, ...this.list()].slice(0, 500);
    this.write(entries);
    return created;
  }

  public list(): ValidationHistoryEntry[] {
    if (!existsSync(this.historyFile)) return [];
    try {
      const parsed = JSON.parse(readFileSync(this.historyFile, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public get(id: string): ValidationHistoryEntry | undefined {
    return this.list().find((entry) => entry.id === id);
  }

  public clear(): void {
    this.write([]);
  }

  private write(entries: ValidationHistoryEntry[]): void {
    const temporary = `${this.historyFile}.${randomUUID()}.tmp`;
    writeFileSync(temporary, JSON.stringify(entries, null, 2), "utf8");
    renameSync(temporary, this.historyFile);
  }
}
