import type { NextRequest } from "next/server";
import { saveDraft } from "@/lib/repo/drafts";
import { isSameOrigin, json, fail, readJson, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import type { DraftData } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const { id } = await context.params;
  const limit = rateLimit(`draft-save:${id}`, 240, 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson<{
    secret?: string;
    data?: DraftData;
    step?: number;
    version?: number;
  }>(request, 400 * 1024);

  if (!body?.secret || !body.data || typeof body.step !== "number" || typeof body.version !== "number") {
    return fail("Kërkesa e ruajtjes është e pavlefshme.", 400);
  }

  const result = await saveDraft({
    id,
    secret: body.secret,
    data: body.data,
    step: body.step,
    version: body.version,
  });

  if (!result.ok) {
    if (result.reason === "stale") {
      return json({ ok: false, error: "stale", version: null }, { status: 409 });
    }
    if (result.reason === "unauthorized") {
      return fail("Drafti nuk u gjet ose ka skaduar.", 404);
    }
    return fail("Të dhënat e draftit janë të pavlefshme.", 422);
  }

  return json(result);
}

export async function GET() {
  return fail("Metoda nuk lejohet.", 405);
}
