import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { demoDataRoot } from "./demo-paths";
import type { BlobStore } from "./types";

/** Local private blob store for demo mode. Never served directly. */
export class FileBlobStore implements BlobStore {
  readonly kind = "file" as const;
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.join(demoDataRoot(), "uploads");
  }

  private resolve(key: string): string {
    const normalised = path
      .normalize(key)
      .replace(/^([/\\])+/, "")
      .replace(/\.\./g, "");
    const target = path.join(this.baseDir, normalised);
    if (!target.startsWith(this.baseDir)) throw new Error("Invalid storage key");
    return target;
  }

  async put(key: string, data: Buffer, _contentType: string): Promise<void> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const target = this.resolve(key);
      const data = await fs.readFile(target);
      const ext = path.extname(target).toLowerCase();
      const contentType =
        ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
      return { data, contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch {
      /* already gone */
    }
  }

  async signedUrl(): Promise<string | null> {
    return null;
  }
}
