import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import type { DvYearRecord } from "@/lib/types";

const COLLECTION = "dvYears";

function defaultYear(): DvYearRecord {
  const year = Number(process.env.DV_ACTIVE_YEAR ?? 2027);
  return {
    id: String(year),
    year,
    opensAt: process.env.DV_OPENS_AT ?? "2026-10-01T00:00:00Z",
    closesAt: process.env.DV_CLOSES_AT ?? "2026-11-04T23:59:59Z",
    instructionsUrl: process.env.DV_INSTRUCTIONS_URL ?? "https://dvprogram.state.gov/",
    photoRulesVersion: process.env.DV_PHOTO_RULES_VERSION ?? "2027.1",
    active: true,
    eligibleCountries: null,
    notes: "Configured from environment defaults. Verify against official DV instructions before launch.",
  };
}

export async function listDvYears(): Promise<DvYearRecord[]> {
  const store = getStore();
  const rows = await store.query<DvYearRecord>(COLLECTION, {
    orderBy: [{ field: "year", direction: "desc" }],
  });
  if (rows.length === 0) {
    const created = defaultYear();
    await store.set(COLLECTION, created.id, created);
    return [created];
  }
  return rows;
}

export async function getActiveDvYear(): Promise<DvYearRecord> {
  const rows = await listDvYears();
  return rows.find((row) => row.active) ?? rows[0];
}

export async function upsertDvYear(
  input: Partial<DvYearRecord> & { year: number },
  actorEmail: string,
): Promise<DvYearRecord> {
  const store = getStore();
  const id = String(input.year);
  const existing = await store.get<DvYearRecord>(COLLECTION, id);
  const record: DvYearRecord = {
    ...defaultYear(),
    ...existing,
    ...input,
    id,
    updatedAt: nowIso(),
    updatedBy: actorEmail,
  } as DvYearRecord;
  await store.set(COLLECTION, id, record);
  return record;
}

export async function setActiveDvYear(year: number, actorEmail: string): Promise<void> {
  const store = getStore();
  const rows = await listDvYears();
  await Promise.all(
    rows.map((row) =>
      store.merge<DvYearRecord>(COLLECTION, row.id, {
        active: row.year === year,
        updatedAt: nowIso(),
        updatedBy: actorEmail,
      } as Partial<DvYearRecord>),
    ),
  );
}

export function isWindowOpen(year: DvYearRecord, at = new Date()): boolean {
  const opens = new Date(year.opensAt);
  const closes = new Date(year.closesAt);
  return at >= opens && at <= closes;
}
