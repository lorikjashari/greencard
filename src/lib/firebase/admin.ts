import "server-only";

import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Bucket } from "@google-cloud/storage";

let cachedApp: App | null | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

function buildApp(): App | null {
  if (!isFirebaseConfigured()) return null;

  // Imported lazily so the demo build never evaluates firebase-admin.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getApps, initializeApp, cert } = require("firebase-admin/app") as typeof import("firebase-admin/app");

  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;
  try {
    cachedApp = buildApp();
  } catch (error) {
    console.error("[firebase] Admin SDK initialisation failed:", (error as Error).message);
    cachedApp = null;
  }
  return cachedApp;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return getFirestore(app);
}

export function getAdminBucket(): Bucket | null {
  const app = getAdminApp();
  if (!app) return null;
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require("firebase-admin/storage") as typeof import("firebase-admin/storage");
  return getStorage(app).bucket(bucketName);
}

export async function verifyIdToken(token: string) {
  const app = getAdminApp();
  if (!app) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
  try {
    return await getAuth(app).verifyIdToken(token, true);
  } catch {
    return null;
  }
}
