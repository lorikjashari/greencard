import "server-only";

import type { Bucket } from "@google-cloud/storage";
import type { BlobStore } from "./types";

export class FirebaseBlobStore implements BlobStore {
  readonly kind = "firebase" as const;

  constructor(private readonly bucket: Bucket) {}

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.bucket.file(key).save(data, {
      contentType,
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=0, no-store",
        contentType,
      },
    });
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const file = this.bucket.file(key);
      const [exists] = await file.exists();
      if (!exists) return null;
      const [data] = await file.download();
      const [metadata] = await file.getMetadata();
      return { data, contentType: metadata.contentType ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.bucket.file(key).delete();
    } catch {
      /* already gone */
    }
  }

  async signedUrl(key: string, expiresMs = 15 * 60 * 1000): Promise<string | null> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresMs,
    });
    return url;
  }
}
