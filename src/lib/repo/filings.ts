import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import type { FilingRecord } from "@/lib/types";

const COLLECTION = "filings";

export async function recordFiling(input: {
  applicationId: string;
  dvYear: number;
  confirmationNumber: string;
  filedBy: { uid: string; email: string };
  notes?: string;
}): Promise<FilingRecord> {
  const trimmed = input.confirmationNumber.trim();
  if (trimmed.length < 6) {
    throw new Error("Confirmation number looks too short. Verify it on the official site.");
  }

  const record: FilingRecord = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId,
    dvYear: input.dvYear,
    confirmationNumber: trimmed,
    filedAt: nowIso(),
    filedBy: input.filedBy.email,
    notes: input.notes?.trim() || null,
    createdAt: nowIso(),
  };
  await getStore().set(COLLECTION, record.id, record);
  return record;
}

export async function getFilingForApplication(applicationId: string): Promise<FilingRecord | null> {
  const rows = await getStore().query<FilingRecord>(COLLECTION, {
    where: [{ field: "applicationId", op: "==", value: applicationId }],
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function listFilings(dvYear?: number): Promise<FilingRecord[]> {
  const rows = await getStore().all<FilingRecord>(COLLECTION);
  const filtered = dvYear ? rows.filter((row) => row.dvYear === dvYear) : rows;
  return filtered.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}
