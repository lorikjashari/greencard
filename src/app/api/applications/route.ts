import type { NextRequest } from "next/server";
import { submitApplication } from "@/features/applications/submit";
import { encodeLastApplication, LAST_APP_COOKIE, LAST_APP_COOKIE_OPTIONS } from "@/lib/auth/last-application";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const limit = rateLimit(`submit:${getClientIp(request)}`, 12, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<Record<string, unknown>>(request, 600 * 1024);
  if (!body) return fail("Kërkesa nuk është e vlefshme.", 400);

  const draftId = typeof body.draftId === "string" ? body.draftId : undefined;
  const draftSecret = typeof body.draftSecret === "string" ? body.draftSecret : undefined;
  if (!draftId || !draftSecret) {
    return fail("Sesioni i draftit mungon. Rifresko faqen dhe provo përsëri.", 400);
  }

  let result: Awaited<ReturnType<typeof submitApplication>>;
  try {
    result = await submitApplication(body, { draftId, draftSecret, locale: "sq" });
  } catch (error) {
    console.error("[submission] unexpected failure", (error as Error).message);
    return fail("Dorëzimi nuk përfundoi për shkak të një gabimi të përkohshëm. Provo përsëri; nëse përsëritet, kontakto zyrën.", 503);
  }

  if (!result.ok) {
    return json(
      { ok: false, error: result.error, fieldErrors: result.fieldErrors ?? null },
      { status: 422 },
    );
  }

  const response = json({
    ok: true,
    ref: result.application.ref,
    applicationId: result.application.id,
    portalLink: result.portalLink,
    checkoutUrl: result.checkoutUrl,
    warnings: result.warnings,
  });

  response.cookies.set(LAST_APP_COOKIE, encodeLastApplication(result.application.id), LAST_APP_COOKIE_OPTIONS);

  return response;
}
