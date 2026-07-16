import "reflect-metadata";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { ValidationHistoryStore } from "./ValidationHistoryStore";

let directory = "";
afterEach(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });

describe("ValidationHistoryStore", () => {
  it("persists and clears history", () => {
    directory = mkdtempSync(path.join(tmpdir(), "openvalidator-history-"));
    const store = new ValidationHistoryStore(directory);
    store.add({ path: "/pets", method: "GET", validationMode: "REQUEST", valid: true, errorCount: 0, result: { valid: true } });
    expect(store.list()).toHaveLength(1);
    store.clear();
    expect(store.list()).toEqual([]);
  });
});
