import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import { emailConfigured } from "@/lib/config";
import { renderEmail, type EmailContext, type EmailType } from "./templates";
import type { EmailOutboxRecord, Locale, NotificationRecord } from "@/lib/types";

const COLLECTION = "notifications";
const OUTBOX = "emailOutbox";

interface SendResult {
  ok: boolean;
  messageId: string | null;
  error: string | null;
  provider: string;
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, messageId: null, error: "RESEND_API_KEY or EMAIL_FROM missing", provider: "resend" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        ok: false,
        messageId: null,
        error: `Resend ${response.status}: ${detail.slice(0, 180)}`,
        provider: "resend",
      };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, messageId: payload.id ?? null, error: null, provider: "resend" };
  } catch (error) {
    return { ok: false, messageId: null, error: (error as Error).message, provider: "resend" };
  }
}

export async function queueEmail(input: {
  to: string;
  type: EmailType;
  locale: Locale;
  applicationId?: string | null;
  context: EmailContext;
  dedupeKey: string;
}): Promise<NotificationRecord> {
  const store = getStore();

  const existing = await store.query<NotificationRecord>(COLLECTION, {
    where: [{ field: "dedupeKey", op: "==", value: input.dedupeKey }],
    limit: 1,
  });
  if (existing[0]) return existing[0];

  const rendered = renderEmail(input.type, input.locale, input.context);
  const configured = emailConfigured();
  const now = nowIso();

  const record: NotificationRecord = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId ?? null,
    type: input.type,
    channel: "email",
    to: input.to.trim().toLowerCase(),
    locale: input.locale,
    subject: rendered.subject,
    status: configured ? "queued" : "not_configured",
    provider: configured ? "resend" : "outbox",
    providerMessageId: null,
    error: configured ? null : "EMAIL_PROVIDER not configured — message stored in outbox only.",
    bodyPreview: rendered.text.slice(0, 400),
    createdAt: now,
    sentAt: null,
    dedupeKey: input.dedupeKey,
  };

  await store.set(COLLECTION, record.id, record);

  const outbox: EmailOutboxRecord = {
    id: crypto.randomUUID(),
    notificationId: record.id,
    to: record.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    createdAt: now,
  };
  await store.set(OUTBOX, outbox.id, outbox);

  if (!configured) {
    return record;
  }

  const result = await sendViaResend({
    to: record.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const updated: NotificationRecord = {
    ...record,
    status: result.ok ? "sent" : "failed",
    provider: result.provider,
    providerMessageId: result.messageId,
    error: result.error,
    sentAt: result.ok ? nowIso() : null,
  };
  await store.set(COLLECTION, record.id, updated);
  return updated;
}

export async function latestNotificationFor(
  applicationId: string,
  type: EmailType,
): Promise<NotificationRecord | null> {
  const rows = await getStore().query<NotificationRecord>(COLLECTION, {
    where: [{ field: "applicationId", op: "==", value: applicationId }],
  });
  return (
    rows
      .filter((record) => record.type === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export async function retryNotification(id: string): Promise<NotificationRecord | null> {  const store = getStore();
  const record = await store.get<NotificationRecord>(COLLECTION, id);
  if (!record) return null;
  if (record.status === "sent") return record;
  if (!emailConfigured()) {
    return { ...record, error: "Email provider is not configured. Nothing was sent." };
  }
  // Re-sending requires the stored body; the outbox holds the rendered HTML.
  const outbox = await store.query<EmailOutboxRecord>(OUTBOX, {
    where: [{ field: "notificationId", op: "==", value: id }],
    limit: 1,
  });
  if (!outbox[0]) {
    return { ...record, error: "No stored body available for retry." };
  }

  const result = await sendViaResend({
    to: record.to,
    subject: outbox[0].subject,
    html: outbox[0].html,
    text: outbox[0].text,
  });

  const updated: NotificationRecord = {
    ...record,
    status: result.ok ? "sent" : "failed",
    provider: result.provider,
    providerMessageId: result.messageId,
    error: result.error,
    sentAt: result.ok ? nowIso() : null,
  };
  await store.set(COLLECTION, record.id, updated);
  return updated;
}

export async function listNotifications(filter?: {
  applicationId?: string;
  status?: string;
}): Promise<NotificationRecord[]> {
  const rows = await getStore().all<NotificationRecord>(COLLECTION);
  let filtered = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.applicationId) filtered = filtered.filter((row) => row.applicationId === filter.applicationId);
  if (filter?.status) filtered = filtered.filter((row) => row.status === filter.status);
  return filtered;
}

export async function listOutbox(): Promise<EmailOutboxRecord[]> {
  const rows = await getStore().all<EmailOutboxRecord>(OUTBOX);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
