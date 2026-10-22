import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "@/lib/auth/secret";

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

/**
 * Signed, expiring read token for a private object. Used so an <img> tag can
 * display a draft photo without exposing the upload secret. Access control for
 * admin/portal browsing still goes through the session check in /api/files.
 */
export function signFileToken(key: string, ttlSeconds = 60 * 60 * 6): string {
  const expires = Date.now() + ttlSeconds * 1000;
  return `${expires}.${sign(`${key}:${expires}`)}`;
}

export function verifyFileToken(key: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  const expected = sign(`${key}:${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function filePreviewUrl(key: string, ttlSeconds = 60 * 60 * 6): string {
  return `/api/files/${key}?t=${encodeURIComponent(signFileToken(key, ttlSeconds))}`;
}
