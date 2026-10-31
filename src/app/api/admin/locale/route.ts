import type { NextRequest } from "next/server";
import { ADMIN_LOCALE_COOKIE } from "@/lib/admin/locale";
import { fail, isSameOrigin, json, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const body = await readJson<{ locale?: string }>(request, 1024);
  const locale = body?.locale === "en" ? "en" : "sq";

  const response = json({ ok: true, locale });
  response.cookies.set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
