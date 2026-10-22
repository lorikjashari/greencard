import type { NextRequest } from "next/server";
import { consumeMagicToken } from "@/lib/repo/tokens";
import { getDraft, rotateDraftSecret } from "@/lib/repo/drafts";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const limit = rateLimit(`draft-resume:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ handoff?: string }>(request, 4096);
  if (!body?.handoff) return fail("Lidhja nuk është e vlefshme.", 400);

  const token = await consumeMagicToken(body.handoff);
  if (!token || token.purpose !== "resume" || !token.draftId) {
    return fail("Lidhja ka skaduar ose është përdorur.", 410);
  }

  const draft = await getDraft(token.draftId);
  if (!draft || draft.submittedApplicationId) {
    return fail("Drafti nuk u gjet ose është dorëzuar.", 404);
  }

  const secret = await rotateDraftSecret(draft.id);
  if (!secret) return fail("Drafti nuk u gjet.", 404);

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
