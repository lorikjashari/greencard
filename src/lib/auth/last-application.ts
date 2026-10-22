import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./secret";

/**
 * The submission endpoint cannot create a full client session (the applicant
 * has not claimed the portal yet), but the completion page needs to show the
 * case that was just created. This short-lived signed cookie proves the
 * browser received the server response; an unsigned application id would let
 * anyone view another case by guessing an id.
 */
export const LAST_APP_COOKIE = "gck_last_app";

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(`last-app:${value}`).digest("base64url");
}

export function encodeLastApplication(applicationId: string): string {
  const body = Buffer.from(
    JSON.stringify({ applicationId, exp: Date.now() + 2 * 60 * 60 * 1000 }),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeLastApplication(raw: string | undefined): string | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      applicationId?: string;
      exp?: number;
    };
    if (!parsed.applicationId || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.applicationId;
  } catch {
    return null;
  }
}

export const LAST_APP_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 2 * 60 * 60,
};
