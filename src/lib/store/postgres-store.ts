import "server-only";

import { neon } from "@neondatabase/serverless";
import { matchesAll, sortRows } from "./query";
import type { DataStore, QueryOptions, StoredDoc } from "./types";

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

function toDoc<T>(row: { id: string; data: Record<string, unknown> }): StoredDoc<T> {
  return { ...(row.data as object), id: row.id } as StoredDoc<T>;
}

/**
 * Neon Postgres-backed document store.
 *
 * Documents are kept in a single `app_documents` table (collection, id, data
 * jsonb). The schema is created by `npm run db:migrate` (db/neon-schema.sql).
 * Filtering and sorting reuse the same in-memory helpers as the demo store so
 * business behaviour is identical across backends.
 */
export class PostgresStore implements DataStore {
  readonly kind = "postgres" as const;

  async get<T>(collection: string, id: string): Promise<StoredDoc<T> | null> {
    const sql = getSql();
    const rows = await sql`
      SELECT id, data FROM app_documents
      WHERE collection = ${collection} AND id = ${id}
      LIMIT 1
    `;
    const row = rows[0] as { id: string; data: Record<string, unknown> } | undefined;
    return row ? toDoc<T>(row) : null;
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    const sql = getSql();
    const payload = JSON.stringify({ ...(data as object), id });
    await sql`
      INSERT INTO app_documents (collection, id, data, updated_at)
      VALUES (${collection}, ${id}, ${payload}::jsonb, now())
      ON CONFLICT (collection, id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
  }

  async merge<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const sql = getSql();
    const payload = JSON.stringify({ ...(data as object), id });
    await sql`
      INSERT INTO app_documents (collection, id, data, updated_at)
      VALUES (${collection}, ${id}, ${payload}::jsonb, now())
      ON CONFLICT (collection, id)
      DO UPDATE SET data = app_documents.data || EXCLUDED.data, updated_at = now()
    `;
  }

  async delete(collection: string, id: string): Promise<void> {
    const sql = getSql();
    await sql`
      DELETE FROM app_documents
      WHERE collection = ${collection} AND id = ${id}
    `;
  }

  async all<T>(collection: string): Promise<Array<StoredDoc<T>>> {
    const sql = getSql();
    const rows = await sql`
      SELECT id, data FROM app_documents
      WHERE collection = ${collection}
      ORDER BY created_at ASC
    `;
    return (rows as Array<{ id: string; data: Record<string, unknown> }>).map(toDoc<T>);
  }

  async query<T>(collection: string, options: QueryOptions = {}): Promise<Array<StoredDoc<T>>> {
    let rows = await this.all<T>(collection);
    rows = rows.filter((row) => matchesAll(row, options.where ?? []));
    rows = sortRows(rows, options.orderBy);
    const offset = options.offset ?? 0;
    if (offset > 0) rows = rows.slice(offset);
    if (typeof options.limit === "number") rows = rows.slice(0, options.limit);
    return rows;
  }

  async count(collection: string, options: QueryOptions = {}): Promise<number> {
    const rows = await this.all(collection);
    return rows.filter((row) => matchesAll(row, options.where ?? [])).length;
  }
}
