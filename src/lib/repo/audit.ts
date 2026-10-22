import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import type { AuditLogRecord } from "@/lib/types";

const COLLECTION = "auditLogs";

export async function logAudit(input: {
  actor: { uid: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: AuditLogRecord["metadata"];
}): Promise<void> {
  const record: AuditLogRecord = {
    id: crypto.randomUUID(),
    actorId: input.actor.uid,
    actorEmail: input.actor.email,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata,
    createdAt: nowIso(),
  };
  await getStore().set(COLLECTION, record.id, record);
}

export async function listAudit(filter?: {
  actor?: string;
  entityType?: string;
  action?: string;
  query?: string;
  limit?: number;
}): Promise<AuditLogRecord[]> {
  const rows = await getStore().all<AuditLogRecord>(COLLECTION);
  let filtered = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filter?.actor) filtered = filtered.filter((row) => row.actorEmail.includes(filter.actor!.toLowerCase()));
  if (filter?.entityType) filtered = filtered.filter((row) => row.entityType === filter.entityType);
  if (filter?.action) filtered = filtered.filter((row) => row.action === filter.action);
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    filtered = filtered.filter(
      (row) =>
        row.summary.toLowerCase().includes(q) ||
        row.entityId.toLowerCase().includes(q) ||
        row.actorEmail.toLowerCase().includes(q),
    );
  }
  return filter?.limit ? filtered.slice(0, filter.limit) : filtered;
}
