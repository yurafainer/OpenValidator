import type { ValidationHistoryEntry } from "../../domain/history/ValidationHistoryEntry";

export interface ValidationHistoryRepository {
  add(entry: Omit<ValidationHistoryEntry, "id" | "createdAt">): Promise<ValidationHistoryEntry>;
  list(): Promise<ValidationHistoryEntry[]>;
  get(id: string): Promise<ValidationHistoryEntry | undefined>;
  clear(): Promise<void>;
}
