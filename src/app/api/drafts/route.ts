import type { NextRequest } from "next/server";
import { createDraft } from "@/lib/repo/drafts";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const limit = rateLimit(`draft-create:${getClientIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ locale?: string }>(request, 2048);
  const locale = body?.locale && isLocale(body.locale) ? body.locale : "sq";

  const { draft, secret } = await createDraft(locale);

  return json({
    ok: true,
    draft: {
      id: draft.id,
      secret,
      version: draft.version,
      step: draft.step,
      data: draft.data,
    },
  });
}
