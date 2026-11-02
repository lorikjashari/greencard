import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { consumeMagicToken, createMagicToken } from "@/lib/repo/tokens";
import { ensureUser, findUserByEmail } from "@/lib/repo/users";
import { encodeSession, sessionCookieOptions, sessionTtlMinutes, COOKIE_NAME } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/session";
import { getPublicConfig } from "@/lib/config";
import { logAudit } from "@/lib/repo/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char]!;
  });
}

function confirmationPage(token: string, locale: "sq" | "en", origin: string): string {
  const sq = locale === "sq";
  const title = sq ? "Vazhdo hyrjen" : "Continue sign-in";
  const body = sq
    ? "Lidhja është e vlefshme. Kliko butonin për të hapur llogarinë tënde."
    : "Your link is valid. Click the button to open your account.";
  const button = sq ? "Vazhdo" : "Continue";
  const note = sq
    ? "Për siguri, lidhja përdoret vetëm një herë."
    : "For security, this link can be used only once.";

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${title} · Aplikodv</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#EFEBE0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#143229;">
    <main style="width:100%;max-width:420px;background:#FBF9F3;border:1px solid #DCD5C4;border-top:3px solid #153D32;padding:36px 32px;text-align:center;">
      <img src="${escapeHtml(origin)}/brand/logo.png" width="196" height="41" alt="Aplikodv" style="display:inline-block;width:196px;height:41px;border:0;">
      <h1 style="margin:28px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:normal;">${title}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#3A463F;">${body}</p>
      <form method="POST" style="margin:0;">
        <input type="hidden" name="token" value="${escapeHtml(token)}">
        <input type="hidden" name="locale" value="${locale}">
        <button type="submit" style="display:block;width:100%;padding:15px 24px;background:#153D32;color:#F7F3E7;border:0;border-radius:2px;font-size:12px;font-weight:bold;letter-spacing:1.8px;text-transform:uppercase;cursor:pointer;">${button}</button>
      </form>
      <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#7A857D;">${note}</p>
    </main>
  </body>
</html>`;
}

async function completeSignIn(
  token: string,
  locale: "sq" | "en",
  origin: string,
): Promise<NextResponse> {
  const record = await consumeMagicToken(token);
  if (!record) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, origin), 303);
  }

  if (record.purpose === "resume") {
    if (!record.draftId) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, origin), 303);
    }
    const handoff = await createMagicToken({
      email: record.email,
      purpose: "resume",
      draftId: record.draftId,
      ttlMinutes: 10,
    });
    return NextResponse.redirect(
      new URL(`/${locale}/apply?h=${encodeURIComponent(handoff)}`, origin),
      303,
    );
  }

  const existing = await findUserByEmail(record.email);
  if (existing && !existing.active) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=inactive`, origin), 303);
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

  const response = NextResponse.redirect(new URL(destination, origin), 303);
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

/**
 * GET renders a confirmation page instead of consuming the token. Email
 * security scanners prefetch links; consuming on GET would burn the token
 * before the recipient clicks. POST performs the actual sign-in.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";
  const { appUrl: origin } = getPublicConfig();

  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, origin), 303);
  }

  return new NextResponse(confirmationPage(token, locale, origin), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  const { appUrl: origin } = getPublicConfig();
  const form = await request.formData();
  const token = String(form.get("token") ?? request.nextUrl.searchParams.get("token") ?? "");
  const locale = String(form.get("locale") ?? request.nextUrl.searchParams.get("locale")) === "en" ? "en" : "sq";

  return completeSignIn(token, locale, origin);
}
