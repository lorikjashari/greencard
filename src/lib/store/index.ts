import "server-only";

import { getAdminBucket, isFirebaseConfigured } from "@/lib/firebase/admin";
import { FileBlobStore } from "./blob-file";
import { FirebaseBlobStore } from "./blob-firebase";
import { FileStore } from "./file-store";
import type { BlobStore, DataStore } from "./types";

export type AppMode = "demo" | "firebase";

export function getAppMode(): AppMode {
  const explicit = process.env.APP_MODE?.trim().toLowerCase();
  if (explicit === "firebase") return "firebase";
  if (explicit === "demo") return "demo";
  return isFirebaseConfigured() ? "firebase" : "demo";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

let cachedStore: DataStore | null = null;
let cachedBlobs: BlobStore | null = null;

function isVercelRuntimeCacheEnabled(): boolean {
  return (
    process.env.VERCEL === "1" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

export function getStore(): DataStore {
  if (cachedStore) return cachedStore;

  if (getAppMode() === "firebase") {
    // Import is lazy to keep firebase-admin out of demo builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAdminDb } = require("@/lib/firebase/admin") as typeof import("@/lib/firebase/admin");
    const db = getAdminDb();
    if (!db) {
      throw new Error(
        "APP_MODE=firebase but Firebase Admin credentials are missing. Set FIREBASE_ADMIN_* or switch to APP_MODE=demo.",
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FirestoreStore } = require("./firestore-store") as typeof import("./firestore-store");
    cachedStore = new FirestoreStore(db);
  } else if (isVercelRuntimeCacheEnabled()) {
    try {
      // Vercel runs routes in separate functions, so shared demo state must
      // live in Vercel's Runtime Cache rather than a function-local /tmp file.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RuntimeCacheStore } = require("./runtime-cache-store") as typeof import("./runtime-cache-store");
      cachedStore = new RuntimeCacheStore();
    } catch (error) {
      console.error("Vercel Runtime Cache unavailable; falling back to ephemeral file storage.", error);
      cachedStore = new FileStore();
    }
  } else {
    cachedStore = new FileStore();
  }

  return cachedStore;
}

export function getBlobStore(): BlobStore {
  if (cachedBlobs) return cachedBlobs;

  if (getAppMode() === "firebase") {
    const bucket = getAdminBucket();
    if (!bucket) {
      throw new Error(
        "APP_MODE=firebase but Firebase Storage bucket is not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).",
      );
    }
    cachedBlobs = new FirebaseBlobStore(bucket);
  } else if (isVercelRuntimeCacheEnabled()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RuntimeCacheBlobStore } = require("./runtime-cache-blob") as typeof import("./runtime-cache-blob");
      cachedBlobs = new RuntimeCacheBlobStore();
    } catch (error) {
      console.error("Vercel Runtime Cache unavailable; falling back to ephemeral file storage.", error);
      cachedBlobs = new FileBlobStore();
    }
  } else {
    cachedBlobs = new FileBlobStore();
  }

  return cachedBlobs;
}

export * from "./types";
