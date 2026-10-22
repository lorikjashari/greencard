import "server-only";

import { getCache, type RuntimeCache } from "@vercel/functions";
import type { BlobStore } from "./types";

/**
 * Demo-only blob store for Vercel. Photos are split into sub-2 MB cache items
 * so the public preview can upload and review a photo across isolated
 * functions. This is not durable storage; production must use Firebase Storage.
 */
const TTL_SECONDS = 7 * 24 * 60 * 60;
const CHUNK_BYTES = 1_200_000;
const MAX_CHUNKS = 16;

interface BlobMeta {
  contentType: string;
  chunks: number;
  size: number;
}

function deploymentScope(): string {
  return (
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "local-preview"
  );
}

export class RuntimeCacheBlobStore implements BlobStore {
  readonly kind = "runtime-cache" as const;
  private readonly cache: RuntimeCache;
  private readonly scope = deploymentScope();

  constructor() {
    this.cache = getCache({ namespace: "gck-demo" });
  }

  private metaKey(key: string): string {
    return `${this.scope}:blob:${key}:meta`;
  }

  private chunkKey(key: string, index: number): string {
    return `${this.scope}:blob:${key}:chunk:${index}`;
  }

  private async readMeta(key: string): Promise<BlobMeta | null> {
    const value = await this.cache.get(this.metaKey(key));
    if (!value || typeof value !== "object") return null;
    const meta = value as Partial<BlobMeta>;
    if (
      typeof meta.contentType !== "string" ||
      typeof meta.chunks !== "number" ||
      !Number.isInteger(meta.chunks) ||
      meta.chunks < 1 ||
      meta.chunks > MAX_CHUNKS ||
      typeof meta.size !== "number"
    ) {
      return null;
    }
    return {
      contentType: meta.contentType,
      chunks: meta.chunks,
      size: meta.size,
    };
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const previous = await this.readMeta(key);
    const chunks = Math.max(1, Math.ceil(data.length / CHUNK_BYTES));
    if (chunks > MAX_CHUNKS) throw new Error("Demo photo is too large.");

    for (let index = 0; index < chunks; index += 1) {
      const start = index * CHUNK_BYTES;
      const chunk = data.subarray(start, start + CHUNK_BYTES);
      await this.cache.set(this.chunkKey(key, index), chunk.toString("base64"), {
        ttl: TTL_SECONDS,
      });
    }

    await this.cache.set(
      this.metaKey(key),
      { contentType, chunks, size: data.length } satisfies BlobMeta,
      { ttl: TTL_SECONDS },
    );

    if (previous) {
      for (let index = chunks; index < previous.chunks; index += 1) {
        await this.cache.delete(this.chunkKey(key, index));
      }
    }
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    const meta = await this.readMeta(key);
    if (!meta) return null;

    const parts: Buffer[] = [];
    for (let index = 0; index < meta.chunks; index += 1) {
      const chunk = await this.cache.get(this.chunkKey(key, index));
      if (typeof chunk !== "string") return null;
      parts.push(Buffer.from(chunk, "base64"));
    }

    const data = Buffer.concat(parts);
    if (data.length !== meta.size) return null;
    return { data, contentType: meta.contentType };
  }

  async delete(key: string): Promise<void> {
    const meta = await this.readMeta(key);
    if (meta) {
      for (let index = 0; index < meta.chunks; index += 1) {
        await this.cache.delete(this.chunkKey(key, index));
      }
    }
    await this.cache.delete(this.metaKey(key));
  }

  async signedUrl(): Promise<string | null> {
    return null;
  }
}
