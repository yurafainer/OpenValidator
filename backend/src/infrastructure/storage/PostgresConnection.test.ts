import { describe, expect, it } from "vitest";

import { normalizePostgresConnectionString } from "./PostgresConnection";

describe("normalizePostgresConnectionString", () => {
  it("upgrades Neon sslmode to explicit certificate and hostname verification", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://user:password@example.neon.tech/database?sslmode=require&channel_binding=require",
      true,
    );

    const url = new URL(result);
    expect(url.searchParams.get("sslmode")).toBe("verify-full");
    expect(url.searchParams.get("channel_binding")).toBe("require");
  });

  it("disables SSL explicitly when DATABASE_SSL is false", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://user:password@localhost/database?sslmode=require",
      false,
    );

    expect(new URL(result).searchParams.get("sslmode")).toBe("disable");
  });
});
