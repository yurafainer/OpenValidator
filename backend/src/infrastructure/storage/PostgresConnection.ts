import { Pool } from "pg";

export function normalizePostgresConnectionString(connectionString: string, sslEnabled: boolean): string {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", sslEnabled ? "verify-full" : "disable");
  return url.toString();
}

export function createPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required when STORAGE_PROVIDER=postgres");
  const sslEnabled = process.env.DATABASE_SSL !== "false";
  return new Pool({
    connectionString: normalizePostgresConnectionString(connectionString, sslEnabled),
    max: Number(process.env.DATABASE_POOL_SIZE || 5),
  });
}
