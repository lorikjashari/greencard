import type { NextRequest } from "next/server";
import { listApplicationsForEmail } from "@/lib/repo/applications";
import { findDraftByEmail } from "@/lib/repo/drafts";
import { createMagicToken } from "@/lib/repo/tokens";
import { findUserByEmail } from "@/lib/repo/users";
import { queueEmail } from "@/lib/notifications/service";
import { emailConfigured, getPublicConfig } from "@/lib/config";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const body = await readJson<{ email?: string; locale?: string }>(request, 4096);
  const email = body?.email?.trim().toLowerCase() ?? "";
  const locale = body?.locale === "en" ? "en" : "sq";

  const ipLimit = rateLimit(`magic-ip:${getClientIp(request)}`, 10, 15 * 60 * 1000);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfterSeconds);

  if (!EMAIL_RE.test(email)) {
    return fail(locale === "sq" ? "Shkruaj një email të vlefshëm." : "Enter a valid email address.", 422);
  }

  const emailLimit = rateLimit(`magic-email:${email}`, 4, 15 * 60 * 1000);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfterSeconds);

  const config = getPublicConfig();
  const applications = await listApplicationsForEmail(email);
  const draft = applications.length === 0 ? await findDraftByEmail(email) : null;
  const user = await findUserByEmail(email);

  // Always return the same response, whether or not the address exists.
  const generic = json({
    ok: true,
    message:
      locale === "sq"
        ? "Nëse ky email ka një aplikim, lidhja u dërgua. Kontrollo edhe dosjen e spamit."
        : "If this email has an application, a link has been sent. Check your spam folder too.",
  });

  if (applications.length > 0) {
    const latest = applications[0];
    const token = await createMagicToken({ email, purpose: "portal", ttlMinutes: 30 });
    const link = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}&kind=portal`;

    await queueEmail({
      to: email,
      type: "portal_link",
      locale,
      applicationId: latest.id,
      dedupeKey: `portal-link:${token}`,
      context: {
        name: latest.applicant.firstName || (locale === "sq" ? "aplikant" : "applicant"),
        reference: latest.ref,
        link,
      },
    });
    if (!emailConfigured()) console.info(`[outbox] Portal sign-in link for ${email}: ${link}`);
    return generic;
  }

  if (draft) {
    const token = await createMagicToken({
      email,
      purpose: "resume",
      draftId: draft.id,
      ttlMinutes: 30,
    });
    const link = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}&kind=resume`;

    await queueEmail({
      to: email,
      type: "resume_link",
      locale,
      dedupeKey: `resume-link:${token}`,
      context: {
        name: draft.data.applicant.firstName || (locale === "sq" ? "aplikant" : "applicant"),
        reference: locale === "sq" ? "draft i ruajtur" : "saved draft",
        link,
      },
    });
    if (!emailConfigured()) console.info(`[outbox] Draft resume link for ${email}: ${link}`);
    return generic;
  }

  if (user && user.role !== "client") {
    const token = await createMagicToken({
      email,
      purpose: "staff",
      ttlMinutes: 20,
    });
    const link = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}&kind=staff`;
    await queueEmail({
      to: email,
      type: "portal_link",
      locale,
      dedupeKey: `staff-link:${token}`,
      context: { name: user.name, reference: "—", link },
    });
    if (!emailConfigured()) console.info(`[outbox] Staff sign-in link for ${email}: ${link}`);
  }

  return generic;
}
