import "server-only";

import { getAppMode } from "@/lib/config";

/**
 * Single source for the signing key. Demo deployments may use the public demo
 * key so a Vercel preview works without secrets; that mode is explicitly
 * labelled and must never hold real data. Firebase mode refuses to start
 * without a strong key.
 */
export function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (getAppMode() === "demo") {
    return "gck-public-demo-session-secret-not-for-real-data";
  }
  throw new Error(
    "SESSION_SECRET is not configured (32+ characters). Refusing to sign sessions with a demo key.",
  );
}
