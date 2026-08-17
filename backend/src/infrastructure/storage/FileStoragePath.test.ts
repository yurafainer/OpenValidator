import { afterEach, describe, expect, it } from "vitest";
import { tmpdir } from "os";
import path from "path";

import { fileStoragePath } from "./FileStoragePath";

const originalVercel = process.env.VERCEL;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
});

describe("fileStoragePath", () => {
  it("uses the writable temporary directory on Vercel", () => {
    process.env.VERCEL = "1";

    expect(fileStoragePath("history")).toBe(
      path.join(tmpdir(), "open-validator", "history"),
    );
  });
});
