import "server-only";

import { FileBlobStore } from "./blob-file";
import { FileStore } from "./file-store";
import type { BlobStore, DataStore } from "./types";

export type AppMode = "demo" | "postgres";

export function getAppMode(): AppMode {
  const explicit = process.env.APP_MODE?.trim().toLowerCase();
  if (explicit === "demo") return "demo";
  if (explicit === "postgres") return "postgres";
  return process.env.DATABASE_URL ? "postgres" : "demo";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

let cachedStore: DataStore | null = null;
let cachedBlobs: BlobStore | null = null;

export function getStore(): DataStore {
  if (cachedStore) return cachedStore;

  if (getAppMode() === "postgres") {
    if (!process.env.DATABASE_URL) {
      throw new Error("APP_MODE=postgres but DATABASE_URL is not configured.");
    }
    // Import is lazy so demo builds never load the Postgres driver.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostgresStore } = require("./postgres-store") as typeof import("./postgres-store");
    cachedStore = new PostgresStore();
  } else {
    cachedStore = new FileStore();
  }

  return cachedStore;
}

export function getBlobStore(): BlobStore {
  if (cachedBlobs) return cachedBlobs;

  if (getAppMode() === "postgres") {
    if (!process.env.DATABASE_URL) {
      throw new Error("APP_MODE=postgres but DATABASE_URL is not configured.");
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostgresBlobStore } = require("./blob-postgres") as typeof import("./blob-postgres");
    cachedBlobs = new PostgresBlobStore();
  } else {
    cachedBlobs = new FileBlobStore();
  }

  return cachedBlobs;
}

export * from "./types";
