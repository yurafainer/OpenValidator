import { SpecificationStore } from "../../application/specifications/SpecificationStore";
import { ValidationHistoryStore } from "../../application/history/ValidationHistoryStore";
import { StorageProvider } from "../../application/storage/StorageProvider";
import { FileSpecificationRepository } from "./FileSpecificationRepository";
import { FileValidationHistoryRepository } from "./FileValidationHistoryRepository";
import { PostgresSpecificationRepository } from "./PostgresSpecificationRepository";
import { PostgresValidationHistoryRepository } from "./PostgresValidationHistoryRepository";
import { createPostgresPool } from "./PostgresConnection";

export interface StorageStores { specificationStore: SpecificationStore; historyStore: ValidationHistoryStore; provider: StorageProvider; }

export function createStorageStores(): StorageStores {
  const requested = String(process.env.STORAGE_PROVIDER || (process.env.DATABASE_URL ? StorageProvider.POSTGRES : StorageProvider.FILE)).toLowerCase();
  if (requested === StorageProvider.POSTGRES) {
    const pool = createPostgresPool();
    return {
      provider: StorageProvider.POSTGRES,
      specificationStore: new SpecificationStore(new PostgresSpecificationRepository(pool)),
      historyStore: new ValidationHistoryStore(new PostgresValidationHistoryRepository(pool)),
    };
  }
  return {
    provider: StorageProvider.FILE,
    specificationStore: new SpecificationStore(new FileSpecificationRepository()),
    historyStore: new ValidationHistoryStore(new FileValidationHistoryRepository()),
  };
}
