import "reflect-metadata";
import express from "express";
import multer from "multer";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { SpecificationController } from "./SpecificationController";
import { SpecificationStore } from "../../application/specifications/SpecificationStore";
import { LoadSpecificationUseCase } from "../../application/usecases/LoadSpecificationUseCase";
import { YamlSpecificationLoader } from "../../infrastructure/parser/YamlSpecificationLoader";

const source = '# preserve comments and formatting\r\nopenapi: 3.0.0\r\ninfo:\r\n  title: "תיעוד API"\r\n  version: "1.0"\r\npaths: {}\r\n';
const metadata = { id: "sample", name: "Sample", version: "1.0", fileName: "sample.yaml", storedFileName: "sample.yaml", uploadedAt: "2026-10-06T00:00:00Z", size: Buffer.byteLength(source), sha256: "sample" };

function createTestApp() {
  const store = new SpecificationStore({
    save: vi.fn().mockResolvedValue(metadata),
    list: vi.fn().mockResolvedValue([metadata]),
    get: vi.fn(async (id: string) => id === metadata.id ? metadata : undefined),
    readContent: vi.fn(async (id: string) => id === metadata.id ? Buffer.from(source) : undefined),
    delete: vi.fn().mockResolvedValue(true),
  });
  const controller = new SpecificationController(new LoadSpecificationUseCase(new YamlSpecificationLoader()), store);
  const app = express();
  app.use(express.json());
  app.post("/specifications/load", multer({ storage: multer.memoryStorage() }).single("file"), controller.load);
  app.get("/specifications/:id", controller.get);
  return app;
}

describe("Specification source preview", () => {
  it("returns uploaded YAML verbatim alongside parsed documentation", async () => {
    const response = await request(createTestApp()).post("/specifications/load").attach("file", Buffer.from(source), "sample.yaml").expect(200);
    expect(response.body.sourceContent).toBe(source);
    expect(response.body.sourceLocations["/info/title"]).toBe(4);
    expect(response.body.specification.info.title).toBe("תיעוד API");
  });
  it("returns the original source when reopening a stored specification", async () => {
    const response = await request(createTestApp()).get("/specifications/sample").expect(200);
    expect(response.body.sourceContent).toBe(source);
    expect(response.body.sourceLocations["/info/title"]).toBe(4);
    expect(response.body.storedSpecification.fileName).toBe("sample.yaml");
  });
  it("returns 404 when the source does not exist", async () => {
    const response = await request(createTestApp()).get("/specifications/missing").expect(404);
    expect(response.body.sourceContent).toBeUndefined();
  });
});
