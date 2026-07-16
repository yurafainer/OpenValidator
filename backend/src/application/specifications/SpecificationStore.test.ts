import "reflect-metadata";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { FileSpecificationRepository } from "../../infrastructure/storage/FileSpecificationRepository";
import { SpecificationStore } from "./SpecificationStore";

const directories: string[] = [];
afterEach(() => { directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })); });

describe("SpecificationStore", () => {
  it("saves, lists and reads a specification", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "openvalidator-specs-")); directories.push(directory);
    const store = new SpecificationStore(new FileSpecificationRepository(directory));
    const content = Buffer.from("openapi: 3.0.0\npaths: {}", "utf8");
    const saved = await store.save("sample.yaml", content, "Mandate Services", "1.0.0");
    expect(await store.list()).toHaveLength(1);
    expect((await store.get(saved.id))?.fileName).toBe("sample.yaml");
    expect((await store.get(saved.id))?.name).toBe("Mandate Services");
    expect((await store.get(saved.id))?.version).toBe("1.0.0");
    expect((await store.readContent(saved.id))?.toString("utf8")).toBe(content.toString("utf8"));
  });
  it("does not duplicate identical content", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "openvalidator-specs-")); directories.push(directory);
    const store = new SpecificationStore(new FileSpecificationRepository(directory));
    const content = Buffer.from("swagger: '2.0'\npaths: {}", "utf8");
    const first = await store.save("first.yaml", content);
    const second = await store.save("second.yaml", content);
    expect(second.id).toBe(first.id);
    expect(await store.list()).toHaveLength(1);
  });
});
