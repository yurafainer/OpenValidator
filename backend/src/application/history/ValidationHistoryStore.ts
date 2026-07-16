import type { ValidationHistoryRepository } from "../storage/ValidationHistoryRepository";
import type { ValidationHistoryEntry } from "../../domain/history/ValidationHistoryEntry";

export class ValidationHistoryStore {
  public constructor(private readonly repository: ValidationHistoryRepository) {}
  public add(entry: Omit<ValidationHistoryEntry, "id" | "createdAt">): Promise<ValidationHistoryEntry> { return this.repository.add(entry); }
  public list(): Promise<ValidationHistoryEntry[]> { return this.repository.list(); }
  public get(id: string): Promise<ValidationHistoryEntry | undefined> { return this.repository.get(id); }
  public clear(): Promise<void> { return this.repository.clear(); }
}
