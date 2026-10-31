import type { NextRequest } from "next/server";
import {
  findUserByEmail,
  isUserLocked,
  registerFailedSignIn,
  registerSuccessfulSignIn,
  LOCK_MINUTES,
  MAX_FAILED_SIGN_INS,
} from "@/lib/repo/users";
import {
  verifyPassword,
  verifyPasswordForMissingUser,
} from "@/lib/auth/password";
import {
  COOKIE_NAME,
  encodeSession,
  isStaffRole,
  sessionCookieOptions,
  sessionTtlMinutes,
} from "@/lib/auth/session";
import { logAudit } from "@/lib/repo/audit";
import { fail, getClientIp, isSameOrigin, json, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function message(locale: "sq" | "en", key: "invalid" | "inactive" | "locked" | "missing") {
  const copy = {
    invalid: {
      sq: "Email ose fjalëkalim i gabuar.",
      en: "Wrong email or password.",
    },
    inactive: {
      sq: "Llogaria është çaktivizuar ose pret aprovim.",
      en: "The account is deactivated or awaiting approval.",
    },
    locked: {
      sq: `Shumë tentativa të gabuara. Provo përsëri pas ${LOCK_MINUTES} minutash.`,
      en: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
    },
    missing: {
      sq: "Kjo llogari nuk ka fjalëkalim. Përdor lidhjen me email.",
      en: "This account has no password. Use the email link instead.",
    },
  } as const;
  return copy[key][locale];
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const body = await readJson<{ email?: string; password?: string; locale?: string }>(request, 4096);
  const locale = body?.locale === "en" ? "en" : "sq";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  const ipLimit = rateLimit(`password-ip:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfterSeconds);

  if (!EMAIL_RE.test(email) || password.length === 0) {
    return fail(message(locale, "invalid"), 401);
  }

  const emailLimit = rateLimit(`password-email:${email}`, 10, 10 * 60 * 1000);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfterSeconds);

  const user = await findUserByEmail(email);
  if (!user || !isStaffRole(user.role) || !user.passwordHash) {
    await verifyPasswordForMissingUser(password);
    return fail(message(locale, "invalid"), 401);
  }

  if (!user.active) return fail(message(locale, "inactive"), 403);

  if (isUserLocked(user)) {
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(user.lockedUntil!).getTime() - Date.now()) / 1000),
    );
    return json(
      { ok: false, error: message(locale, "locked"), locked: true },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const result = await registerFailedSignIn(user);
    await logAudit({
      actor: { uid: user.id, email: user.email },
      action: "auth.password_failed",
      entityType: "user",
      entityId: user.id,
      summary: "Failed staff password sign-in.",
      metadata: { attempts: result.attempts, locked: Boolean(result.lockedUntil) },
    });
    if (result.lockedUntil) {
      return json(
        { ok: false, error: message(locale, "locked"), locked: true },
        { status: 429, headers: { "retry-after": String(LOCK_MINUTES * 60) } },
      );
    }
    return json(
      {
        ok: false,
        error: message(locale, "invalid"),
        attemptsRemaining: Math.max(0, MAX_FAILED_SIGN_INS - result.attempts),
      },
      { status: 401 },
    );
  }

  await registerSuccessfulSignIn(user.id);

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
    action: "auth.password_sign_in",
    entityType: "user",
    entityId: user.id,
    summary: `Staff signed in with a password as ${user.role}.`,
  });

  return response;
}
