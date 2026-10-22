import type { NextRequest } from "next/server";
import { authorizeDraft } from "@/lib/repo/drafts";
import { getClientIp, isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const limit = rateLimit(`draft-load:${getClientIp(request)}`, 120, 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{ id?: string; secret?: string }>(request, 4096);
  if (!body?.id || !body.secret) return fail("Mungon identifikuesi i draftit.", 400);

  const draft = await authorizeDraft(body.id, body.secret);
  if (!draft) return fail("Drafti nuk u gjet ose ka skaduar.", 404);

  return json({
    ok: true,
    draft: {
      id: draft.id,
      secret: body.secret,
      version: draft.version,
      step: draft.step,
      data: draft.data,
    },
  });
}
