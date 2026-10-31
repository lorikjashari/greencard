import "server-only";

import { neon } from "@neondatabase/serverless";
import type { BlobStore } from "./types";

type Sql = ReturnType<typeof neon<false, false>>;

let cachedSql: Sql | null = null;

function getSql(): Sql {
  if (cachedSql) return cachedSql;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("APP_MODE=postgres but DATABASE_URL is not configured.");
  }
  cachedSql = neon(url);
  return cachedSql;
}

function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    return Buffer.from(value, "base64");
  }
  throw new Error("Unexpected bytea value from Postgres.");
}

/**
 * Private blob store backed by Neon Postgres (`app_blobs` table).
 *
 * Photos are never served directly: /api/files authorises the request with a
 * signed token or a session check and then streams the bytes through the app.
 */
export class PostgresBlobStore implements BlobStore {
  readonly kind = "postgres" as const;

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const sql = getSql();
    await sql`
      INSERT INTO app_blobs (key, data, content_type, bytes, updated_at)
      VALUES (${key}, ${data}, ${contentType}, ${data.length}, now())
      ON CONFLICT (key)
      DO UPDATE SET data = EXCLUDED.data, content_type = EXCLUDED.content_type,
        bytes = EXCLUDED.bytes, updated_at = now()
    `;
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT data, content_type FROM app_blobs WHERE key = ${key} LIMIT 1
    `;
    const row = rows[0] as { data: unknown; content_type: string } | undefined;
    if (!row) return null;
    return { data: toBuffer(row.data), contentType: row.content_type };
  }

  async delete(key: string): Promise<void> {
    const sql = getSql();
    await sql`DELETE FROM app_blobs WHERE key = ${key}`;
  }

  async signedUrl(): Promise<string | null> {
    return null;
  }
}
