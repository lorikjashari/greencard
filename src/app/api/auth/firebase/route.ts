import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config";
import { verifyIdToken } from "@/lib/firebase/admin";
import { ensureUser, findUserByEmail } from "@/lib/repo/users";
import { logAudit } from "@/lib/repo/audit";
import {
  COOKIE_NAME,
  encodeSession,
  isStaffRole,
  sessionCookieOptions,
  sessionTtlMinutes,
} from "@/lib/auth/session";
import { getClientIp, isSameOrigin, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);
  if (isDemoMode()) return fail("Hyrja me Firebase është çaktivizuar në modin demo.", 403);

  const limit = rateLimit(`firebase-auth:${getClientIp(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ idToken?: string }>(request, 16 * 1024);
  if (!body?.idToken) return fail("Mungon tokeni i hyrjes.", 400);

  const decoded = await verifyIdToken(body.idToken);
  if (!decoded?.email) return fail("Tokeni i hyrjes nuk është i vlefshëm.", 401);
  if (decoded.email_verified === false) {
    return fail("Emaili nuk është verifikuar.", 403);
  }

  const email = decoded.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing && !existing.active) {
    return fail("inactive", 403);
  }

  // Unknown addresses become client accounts. Staff access is never granted
  // implicitly: an administrator must create the staff record first.
  const user =
    existing ??
    (await ensureUser({
      email,
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      role: "client",
      firebaseUid: decoded.uid,
    }));

  if (existing) {
    await ensureUser({ email, role: existing.role, firebaseUid: decoded.uid });
  }

  const response = NextResponse.json(
    {
      ok: true,
      role: user.role,
      destination: isStaffRole(user.role) ? "/admin" : "/account",
    },
    { headers: { "cache-control": "no-store" } },
  );

  response.cookies.set(
    COOKIE_NAME,
    encodeSession(
      { uid: user.id, email: user.email, name: user.name, role: user.role },
      sessionTtlMinutes(user.role),
    ),
    sessionCookieOptions(user.role),
  );

  if (isStaffRole(user.role)) {
    await logAudit({
      actor: { uid: user.id, email: user.email },
      action: "auth.firebase_sign_in",
      entityType: "user",
      entityId: user.id,
      summary: "Staff signed in with Firebase Authentication.",
    });
  }

  return response;
}
