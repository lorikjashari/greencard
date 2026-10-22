import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { consumeMagicToken, createMagicToken } from "@/lib/repo/tokens";
import { ensureUser, findUserByEmail } from "@/lib/repo/users";
import { encodeSession, sessionCookieOptions, sessionTtlMinutes, COOKIE_NAME } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/repo/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";
  const origin = request.nextUrl.origin;

  const record = await consumeMagicToken(token);
  if (!record) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, origin));
  }

  if (record.purpose === "resume") {
    if (!record.draftId) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, origin));
    }
    const handoff = await createMagicToken({
      email: record.email,
      purpose: "resume",
      draftId: record.draftId,
      ttlMinutes: 10,
    });
    return NextResponse.redirect(
      new URL(`/${locale}/apply?h=${encodeURIComponent(handoff)}`, origin),
    );
  }

  const existing = await findUserByEmail(record.email);
  if (existing && !existing.active) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=inactive`, origin));
  }

  const user =
    existing ??
    (await ensureUser({
      email: record.email,
      role: record.purpose === "staff" ? "viewer" : "client",
    }));

  const session = {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const destination =
    isStaffRole(user.role) && (record.purpose === "staff" || user.role !== "client")
      ? "/admin"
      : `/${locale}/account`;

  const response = NextResponse.redirect(new URL(destination, origin));
  response.cookies.set(
    COOKIE_NAME,
    encodeSession(session, sessionTtlMinutes(user.role)),
    sessionCookieOptions(user.role),
  );

  if (isStaffRole(user.role)) {
    await logAudit({
      actor: { uid: user.id, email: user.email },
      action: "auth.sign_in",
      entityType: "user",
      entityId: user.id,
      summary: "Staff signed in with an email link.",
    });
  }

  return response;
}
