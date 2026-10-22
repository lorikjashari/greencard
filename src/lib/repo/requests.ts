import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import type { DataRequestRecord, EditRequestRecord } from "@/lib/types";

const EDITS = "editRequests";
const DATA = "dataRequests";

export async function createEditRequest(input: {
  applicationId: string;
  message: string;
}): Promise<EditRequestRecord> {
  const record: EditRequestRecord = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId,
    message: input.message.trim().slice(0, 2000),
    status: "open",
    createdAt: nowIso(),
    resolvedAt: null,
    resolvedBy: null,
  };
  await getStore().set(EDITS, record.id, record);
  return record;
}

export async function listEditRequests(applicationId?: string): Promise<EditRequestRecord[]> {
  const rows = await getStore().all<EditRequestRecord>(EDITS);
  const filtered = applicationId ? rows.filter((row) => row.applicationId === applicationId) : rows;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function resolveEditRequest(
  id: string,
  status: "resolved" | "declined",
  actorEmail: string,
): Promise<void> {
  await getStore().merge<EditRequestRecord>(EDITS, id, {
    status,
    resolvedAt: nowIso(),
    resolvedBy: actorEmail,
  });
}

export async function createDataRequest(input: {
  applicationId: string | null;
  email: string;
  type: DataRequestRecord["type"];
  message: string;
}): Promise<DataRequestRecord> {
  const record: DataRequestRecord = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId,
    email: input.email.trim().toLowerCase(),
    type: input.type,
    message: input.message.trim().slice(0, 2000),
    status: "open",
    createdAt: nowIso(),
    completedAt: null,
    handledBy: null,
    notes: null,
  };
  await getStore().set(DATA, record.id, record);
  return record;
}

export async function listDataRequests(): Promise<DataRequestRecord[]> {
  const rows = await getStore().all<DataRequestRecord>(DATA);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateDataRequest(
  id: string,
  patch: Partial<Pick<DataRequestRecord, "status" | "notes" | "handledBy" | "completedAt">>,
): Promise<void> {
  await getStore().merge<DataRequestRecord>(DATA, id, patch);
}
