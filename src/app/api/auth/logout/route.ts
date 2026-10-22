import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";
import { getClientIp, isSameOrigin, json, fail, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const limit = rateLimit(`logout:${getClientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const response = json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
