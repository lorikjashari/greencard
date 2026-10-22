import "server-only";

import { getCache, type RuntimeCache } from "@vercel/functions";
import { matchesAll, sortRows } from "./query";
import type { DataStore, QueryOptions, StoredDoc } from "./types";

/**
 * Demo-only store for Vercel deployments.
 *
 * Vercel runs each route in an isolated function, so a local file store cannot
 * share drafts between `/api/drafts` and the page that renders them. Vercel's
 * Runtime Cache is regional and available on every plan, so it gives the
 * public demo a shared, no-credential data layer.
 *
 * This is NOT durable: entries are evicted, do not survive region changes, and
 * are capped at 2 MB per item. Real data must use Firebase. Keys include the
 * deployment id so a redeploy starts from a clean demo seed.
 */
const TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_ITEM_BYTES = 1_900_000;

function deploymentScope(): string {
  return (
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "local-preview"
  );
}

export class RuntimeCacheStore implements DataStore {
  readonly kind = "runtime-cache" as const;
  private readonly cache: RuntimeCache;
  private readonly scope = deploymentScope();
  private locks = new Map<string, Promise<unknown>>();

  constructor() {
    // getCache throws outside a Vercel function context. The factory catches
    // that and falls back to the file store for local development.
    this.cache = getCache({ namespace: "gck-demo" });
  }

  private key(collection: string): string {
    return `${this.scope}:data:${collection}`;
  }

  private async readRaw<T>(collection: string): Promise<Array<StoredDoc<T>>> {
    const parsed = await this.cache.get(this.key(collection));
    return Array.isArray(parsed) ? (parsed as Array<StoredDoc<T>>) : [];
  }

  private async writeRaw<T>(collection: string, rows: Array<StoredDoc<T>>): Promise<void> {
    const bytes = Buffer.byteLength(JSON.stringify(rows), "utf8");
    if (bytes > MAX_ITEM_BYTES) {
      throw new Error(
        "Demo storage limit reached. Configure Firebase for persistent applicant data.",
      );
    }
    await this.cache.set(this.key(collection), rows, { ttl: TTL_SECONDS });
  }

  private withLock<T>(collection: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(collection) ?? Promise.resolve();
    const run = previous.then(fn, fn);
    this.locks.set(
      collection,
      run.catch(() => undefined),
    );
    return run;
  }

  async get<T>(collection: string, id: string): Promise<StoredDoc<T> | null> {
    const rows = await this.readRaw<T>(collection);
    return rows.find((row) => row.id === id) ?? null;
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.withLock(collection, async () => {
      const rows = await this.readRaw<T>(collection);
      const next = rows.filter((row) => row.id !== id);
      next.push({ ...(data as object), id } as StoredDoc<T>);
      await this.writeRaw(collection, next);
    });
  }

  async merge<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    await this.withLock(collection, async () => {
      const rows = await this.readRaw<T>(collection);
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        rows.push({ ...(data as object), id } as StoredDoc<T>);
      } else {
        rows[index] = { ...rows[index], ...(data as object), id } as StoredDoc<T>;
      }
      await this.writeRaw(collection, rows);
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.withLock(collection, async () => {
      const rows = await this.readRaw(collection);
      await this.writeRaw(
        collection,
        rows.filter((row) => row.id !== id),
      );
    });
  }

  async all<T>(collection: string): Promise<Array<StoredDoc<T>>> {
    return this.readRaw<T>(collection);
  }

  async query<T>(collection: string, options: QueryOptions = {}): Promise<Array<StoredDoc<T>>> {
    let rows = await this.readRaw<T>(collection);
    rows = rows.filter((row) => matchesAll(row, options.where ?? []));
    rows = sortRows(rows, options.orderBy);
    const offset = options.offset ?? 0;
    if (offset > 0) rows = rows.slice(offset);
    if (typeof options.limit === "number") rows = rows.slice(0, options.limit);
    return rows;
  }

  async count(collection: string, options: QueryOptions = {}): Promise<number> {
    const rows = await this.readRaw(collection);
    return rows.filter((row) => matchesAll(row, options.where ?? [])).length;
  }
}
