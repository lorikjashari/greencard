import "server-only";

import { NextResponse } from "next/server";

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>): NextResponse {
  return json({ ok: false, error: message, ...extra }, { status });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

/**
 * Rejects cross-origin browser mutations. Same-origin fetches are allowed when
 * the Origin header matches Host. Requests without Origin (server-to-server,
 * curl) are not blocked by this check; they still need a bearer secret.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson<T>(request: Request, maxBytes = 512 * 1024): Promise<T | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function tooMany(retryAfterSeconds: number): NextResponse {
  return json(
    { ok: false, error: "Shumë tentativa. Provo më vonë." },
    { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
  );
}
