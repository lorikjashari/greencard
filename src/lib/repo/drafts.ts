import "server-only";

import { getStore } from "@/lib/store";
import { addDays, isExpired, nowIso, randomToken, sha256 } from "@/lib/ids";
import { emptyDraftData, isDraftData } from "@/lib/draft-data";
import type { DraftData, DraftRecord } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const COLLECTION = "drafts";

export async function createDraft(locale: Locale): Promise<{
  draft: DraftRecord;
  secret: string;
}> {
  const secret = randomToken(24);
  const now = nowIso();
  const draft: DraftRecord = {
    id: crypto.randomUUID(),
    secretHash: sha256(secret),
    locale,
    step: 1,
    version: 1,
    data: emptyDraftData(locale),
    contactEmail: null,
    submittedApplicationId: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: addDays(30),
  };
  await getStore().set(COLLECTION, draft.id, draft);
  return { draft, secret };
}

export async function getDraft(id: string): Promise<DraftRecord | null> {
  const draft = await getStore().get<DraftRecord>(COLLECTION, id);
  if (!draft) return null;
  if (isExpired(draft.expiresAt)) return null;
  return draft;
}

export async function authorizeDraft(id: string, secret: string): Promise<DraftRecord | null> {
  const draft = await getDraft(id);
  if (!draft) return null;
  if (draft.secretHash !== sha256(secret)) return null;
  return draft;
}

export async function saveDraft(input: {
  id: string;
  secret: string;
  data: DraftData;
  step: number;
  version: number;
}): Promise<{ ok: true; version: number; updatedAt: string } | { ok: false; reason: string }> {
  const draft = await authorizeDraft(input.id, input.secret);
  if (!draft) return { ok: false, reason: "unauthorized" };
  if (!isDraftData(input.data)) return { ok: false, reason: "invalid_data" };

  // Reject stale writes so a dropped request cannot overwrite newer answers.
  if (input.version < draft.version) {
    return { ok: false, reason: "stale" };
  }

  const nextVersion = Math.max(draft.version + 1, input.version + 1);
  const updatedAt = nowIso();

  await getStore().merge<DraftRecord>(COLLECTION, draft.id, {
    data: input.data,
    step: Math.min(8, Math.max(1, input.step)),
    version: nextVersion,
    updatedAt,
    contactEmail: input.data.contact.email.trim().toLowerCase() || null,
    expiresAt: addDays(30),
  });

  return { ok: true, version: nextVersion, updatedAt };
}

export async function findDraftByEmail(email: string): Promise<DraftRecord | null> {
  const normalised = email.trim().toLowerCase();
  const rows = await getStore().query<DraftRecord>(COLLECTION, {
    where: [{ field: "contactEmail", op: "==", value: normalised }],
  });
  return (
    rows
      .filter((row) => !row.submittedApplicationId && !isExpired(row.expiresAt))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

/**
 * Issues a fresh draft secret. Used when resuming through an emailed link:
 * the browser that opens the link becomes the only holder of the new secret,
 * and the previous device's stored secret stops working.
 */
export async function rotateDraftSecret(id: string): Promise<string | null> {
  const draft = await getDraft(id);
  if (!draft) return null;
  const secret = randomToken(24);
  await getStore().merge<DraftRecord>(COLLECTION, id, {
    secretHash: sha256(secret),
    updatedAt: nowIso(),
    expiresAt: addDays(30),
  });
  return secret;
}

export async function markDraftSubmitted(id: string, applicationId: string): Promise<void> {
  await getStore().merge<DraftRecord>(COLLECTION, id, {
    submittedApplicationId: applicationId,
    updatedAt: nowIso(),
  });
}
