import { promises as fs } from "node:fs";
import path from "node:path";
import { demoDataRoot } from "./demo-paths";
import { matchesAll, sortRows } from "./query";
import type { DataStore, QueryOptions, StoredDoc } from "./types";

/**
 * File-backed store used in demo mode. Persists to .data/store (or the
 * serverless /tmp fallback) and serialises writes per collection so concurrent
 * autosaves cannot corrupt the file. NOT intended for durable or
 * multi-instance production deployment.
 */
export class FileStore implements DataStore {
  readonly kind = "file" as const;
  private readonly baseDir: string;
  private locks = new Map<string, Promise<unknown>>();

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.join(demoDataRoot(), "store");
  }

  private file(collection: string): string {
    return path.join(this.baseDir, `${collection}.json`);
  }

  private async readRaw<T>(collection: string): Promise<Array<StoredDoc<T>>> {
    try {
      const raw = await fs.readFile(this.file(collection), "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  private async writeRaw<T>(collection: string, rows: Array<StoredDoc<T>>): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const target = this.file(collection);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(rows, null, 2), "utf8");
    await fs.rename(tmp, target);
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


