import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./secret";
import type { Role, SessionUser } from "@/lib/types";

const COOKIE_NAME = "gck_session";
const STAFF_ROLES: Role[] = ["admin", "operator", "accountant", "viewer"];

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function encodeSession(user: SessionUser, ttlMinutes: number): string {
  const payload = {
    ...user,
    exp: Date.now() + ttlMinutes * 60_000,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser & {
      exp: number;
    };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (!parsed.uid || !parsed.email || !parsed.role) return null;
    return { uid: parsed.uid, email: parsed.email, name: parsed.name, role: parsed.role };
  } catch {
    return null;
  }
}

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE_NAME)?.value);
}

export function sessionTtlMinutes(role: Role): number {
  return isStaffRole(role) ? 8 * 60 : 30 * 24 * 60;
}

export function sessionCookieOptions(role: Role) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlMinutes(role) * 60,
  };
}

export async function setSession(user: SessionUser): Promise<void> {
  const ttlMinutes = sessionTtlMinutes(user.role);
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession(user, ttlMinutes), sessionCookieOptions(user.role));
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };
