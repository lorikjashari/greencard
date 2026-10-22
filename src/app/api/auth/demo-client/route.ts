import type { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/config";
import { findUserByEmail } from "@/lib/repo/users";
import { ensureDemoSeed } from "@/lib/demo/seed";
import { logAudit } from "@/lib/repo/audit";
import { encodeSession, sessionCookieOptions, sessionTtlMinutes, COOKIE_NAME } from "@/lib/auth/session";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Demo-only client sign-in so the portal can be exercised without a mailbox. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);
  if (!isDemoMode()) return fail("Hyrja demo është çaktivizuar.", 403);

  const limit = rateLimit(`demo-client:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ email?: string }>(request, 2048);
  const email = (body?.email ?? "client@demo.greencardkosova.com").trim().toLowerCase();

  await ensureDemoSeed();

  const user = await findUserByEmail(email);
  if (!user || !user.active || user.role !== "client") {
    return fail("Llogaria demo nuk u gjet.", 404);
  }

  const response = json({ ok: true, role: user.role });
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
    action: "auth.demo_client_sign_in",
    entityType: "user",
    entityId: user.id,
    summary: "Demo client signed in.",
  });

  return response;
}
