import type { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/config";
import { findUserByEmail } from "@/lib/repo/users";
import { ensureDemoSeed } from "@/lib/demo/seed";
import { logAudit } from "@/lib/repo/audit";
import { encodeSession, sessionCookieOptions, sessionTtlMinutes, COOKIE_NAME, isStaffRole } from "@/lib/auth/session";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Demo-only staff sign-in. Disabled whenever the app runs against Postgres;
 * production authentication goes through email magic links instead.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);
  if (!isDemoMode()) {
    return fail("Hyrja demo është çaktivizuar në këtë mjedis.", 403);
  }

  const limit = rateLimit(`staff-login:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ email?: string }>(request, 2048);
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email) return fail("Zgjidh një llogari.", 400);

  await ensureDemoSeed();

  const user = await findUserByEmail(email);
  if (!user || !user.active || !isStaffRole(user.role)) {
    return fail("Llogaria nuk është e autorizuar.", 403);
  }

  const response = json({ ok: true, role: user.role, name: user.name });
  response.cookies.set(
    COOKIE_NAME,
    encodeSession(
      { uid: user.id, email: user.email, name: user.name, role: user.role },
      sessionTtlMinutes(user.role),
    ),
    sessionCookieOptions(user.role),
  );

  await logAudit({
    actor: { uid: user.id, email: user.email },
    action: "auth.demo_sign_in",
    entityType: "user",
    entityId: user.id,
    summary: `Demo sign-in as ${user.role}.`,
  });

  return response;
}
