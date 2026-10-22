import "server-only";

import { getStore } from "@/lib/store";
import { addMinutes, isExpired, nowIso, randomToken, sha256 } from "@/lib/ids";
import type { MagicTokenRecord } from "@/lib/types";

const COLLECTION = "magicTokens";
const consuming = new Set<string>();

export async function createMagicToken(input: {
  email: string;
  purpose: MagicTokenRecord["purpose"];
  applicationId?: string | null;
  draftId?: string | null;
  ttlMinutes?: number;
}): Promise<string> {
  const raw = randomToken(32);
  const now = nowIso();
  const record: MagicTokenRecord = {
    id: crypto.randomUUID(),
    tokenHash: sha256(raw),
    email: input.email.trim().toLowerCase(),
    purpose: input.purpose,
    applicationId: input.applicationId ?? null,
    draftId: input.draftId ?? null,
    createdAt: now,
    expiresAt: addMinutes(input.ttlMinutes ?? 20),
    usedAt: null,
  };
  await getStore().set(COLLECTION, record.id, record);
  return raw;
}

export async function consumeMagicToken(raw: string): Promise<MagicTokenRecord | null> {
  if (!raw || raw.length < 20) return null;
  const hash = sha256(raw);
  if (consuming.has(hash)) return null;
  consuming.add(hash);
  try {
    const rows = await getStore().query<MagicTokenRecord>(COLLECTION, {
      where: [{ field: "tokenHash", op: "==", value: hash }],
      limit: 1,
    });
    const record = rows[0];
    if (!record) return null;
    if (record.usedAt) return null;
    if (isExpired(record.expiresAt)) return null;

    await getStore().merge<MagicTokenRecord>(COLLECTION, record.id, { usedAt: nowIso() });
    return record;
  } finally {
    consuming.delete(hash);
  }
}
