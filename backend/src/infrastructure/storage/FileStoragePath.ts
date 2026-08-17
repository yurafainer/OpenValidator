import { tmpdir } from "os";
import path from "path";

export function fileStoragePath(area: "history" | "specifications"): string {
  const root = process.env.VERCEL
    ? path.join(tmpdir(), "open-validator")
    : path.resolve(process.cwd(), "data");

  return path.join(root, area);
}
