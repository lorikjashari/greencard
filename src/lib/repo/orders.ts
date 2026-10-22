import "server-only";

import { getStore } from "@/lib/store";
import { addDays, nowIso, publicRef } from "@/lib/ids";
import { canTransitionPayment } from "@/lib/status/transitions";
import { addActivity, updateApplication } from "./applications";
import type { OrderRecord, PaymentEventRecord, PaymentMethod, PaymentStatus } from "@/lib/types";

const ORDERS = "orders";
const EVENTS = "paymentEvents";

export async function createOrder(input: {
  applicationId: string;
  amountCents: number;
  method: PaymentMethod;
  pricingRulesVersion: string;
  provider: OrderRecord["provider"];
  deadlineDays: number;
}): Promise<OrderRecord> {
  const now = nowIso();
  const order: OrderRecord = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId,
    ref: publicRef(),
    amountCents: input.amountCents,
    currency: "EUR",
    method: input.method,
    status: input.method === "cash" ? "pending_cash" : "pending_card",
    pricingRulesVersion: input.pricingRulesVersion,
    provider: input.provider,
    providerRef: null,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
    expiresAt: addDays(input.deadlineDays),
    receivedBy: null,
    receivedAt: null,
    receivedAmountCents: null,
    receivingMethod: null,
    evidenceNote: null,
    amountMismatch: false,
    mismatchReviewedAt: null,
    mismatchReviewedBy: null,
    mismatchReviewNote: null,
    refundedAt: null,
    refundReason: null,
  };

  await getStore().set(ORDERS, order.id, order);

  const eventId = crypto.randomUUID();
  const event: PaymentEventRecord = {
    id: eventId,
    orderId: order.id,
    applicationId: order.applicationId,
    type: input.method === "cash" ? "cash_pending" : "card_pending",
    amountCents: order.amountCents,
    actorType: "system",
    actorId: null,
    note: null,
    createdAt: now,
  };
  await getStore().set(EVENTS, eventId, event);

  await updateApplication(order.applicationId, { paymentStatus: order.status });
  await addActivity({
    applicationId: order.applicationId,
    type: "payment_pending",
    actorId: null,
    actorName: "Sistemi",
    visibility: "client",
    message:
      input.method === "cash"
        ? `Porosia ${order.ref} u krijua. Pagesa me para në dorë/postë është në pritje.`
        : `Porosia ${order.ref} u krijua. Pagesa me kartë është në pritje.`,
  });

  return order;
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  return getStore().get<OrderRecord>(ORDERS, id);
}

export async function getOrderForApplication(applicationId: string): Promise<OrderRecord | null> {
  const rows = await getStore().query<OrderRecord>(ORDERS, {
    where: [{ field: "applicationId", op: "==", value: applicationId }],
  });
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function listOrders(): Promise<OrderRecord[]> {
  const rows = await getStore().all<OrderRecord>(ORDERS);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPaymentEvents(orderId: string): Promise<PaymentEventRecord[]> {
  const rows = await getStore().query<PaymentEventRecord>(EVENTS, {
    where: [{ field: "orderId", op: "==", value: orderId }],
  });
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function appendPaymentEvent(
  event: Omit<PaymentEventRecord, "id" | "createdAt"> & { createdAt?: string; idempotencyKey?: string | null },
): Promise<PaymentEventRecord> {
  const id = crypto.randomUUID();
  const record: PaymentEventRecord = {
    ...event,
    id,
    createdAt: event.createdAt ?? nowIso(),
  };
  await getStore().set(EVENTS, id, record);
  return record;
}

async function transition(
  order: OrderRecord,
  next: PaymentStatus,
  patch: Partial<OrderRecord> = {},
): Promise<OrderRecord> {
  if (!canTransitionPayment(order.status, next)) {
    throw new Error(`Invalid payment transition ${order.status} → ${next}`);
  }
  const updated: OrderRecord = {
    ...order,
    ...patch,
    status: next,
    updatedAt: nowIso(),
  };
  await getStore().set(ORDERS, order.id, updated);
  await updateApplication(order.applicationId, { paymentStatus: next });
  return updated;
}

export async function recordCashPayment(input: {
  orderId: string;
  receivedAmountCents: number;
  receivedAt: string;
  receivingMethod: "post" | "office" | "bank";
  actor: { uid: string; email: string };
  note?: string;
}): Promise<{ order: OrderRecord; mismatch: boolean }> {
  const order = await getOrder(input.orderId);
  if (!order) throw new Error("Order not found");
  if (order.method !== "cash") throw new Error("This order is not a cash order.");
  if (input.receivedAmountCents <= 0) throw new Error("Received amount must be positive.");

  const mismatch = input.receivedAmountCents !== order.amountCents;
  if (mismatch && !input.note?.trim()) {
    throw new Error("An explanation is required when the received amount differs from the order amount.");
  }

  const updated = await transition(order, "paid", {
    paidAt: input.receivedAt,
    receivedBy: input.actor.email,
    receivedAt: input.receivedAt,
    receivedAmountCents: input.receivedAmountCents,
    receivingMethod: input.receivingMethod,
    evidenceNote: input.note ?? null,
    amountMismatch: mismatch,
  });

  await appendPaymentEvent({
    orderId: order.id,
    applicationId: order.applicationId,
    type: "paid",
    amountCents: input.receivedAmountCents,
    actorType: "staff",
    actorId: input.actor.uid,
    note: `${input.receivingMethod}${mismatch ? " · amount mismatch" : ""}${input.note ? ` · ${input.note}` : ""}`,
    idempotencyKey: `cash:${order.id}:paid`,
  });

  await addActivity({
    applicationId: order.applicationId,
    type: "payment_paid",
    actorId: input.actor.uid,
    actorName: input.actor.email,
    visibility: mismatch ? "internal" : "client",
    message: mismatch
      ? `Pagesa u regjistrua me mospërputhje (${(input.receivedAmountCents / 100).toFixed(2)} € nga ${(order.amountCents / 100).toFixed(2)} €). Kërkohet shqyrtim para dorëzimit.`
      : `Pagesa u konfirmua (${(input.receivedAmountCents / 100).toFixed(2)} €).`,
  });

  return { order: updated, mismatch };
}

export async function reviewPaymentMismatch(input: {
  orderId: string;
  note: string;
  actor: { uid: string; email: string };
}): Promise<OrderRecord> {
  const order = await getOrder(input.orderId);
  if (!order) throw new Error("Order not found");
  if (!order.amountMismatch) throw new Error("This order has no amount mismatch.");
  const note = input.note.trim();
  if (note.length < 5) throw new Error("An explanation is required to review a payment mismatch.");

  const now = nowIso();
  const updated: OrderRecord = {
    ...order,
    mismatchReviewedAt: now,
    mismatchReviewedBy: input.actor.email,
    mismatchReviewNote: note,
    updatedAt: now,
  };
  await getStore().set(ORDERS, order.id, updated);

  await appendPaymentEvent({
    orderId: order.id,
    applicationId: order.applicationId,
    type: "note",
    amountCents: order.receivedAmountCents ?? order.amountCents,
    actorType: "staff",
    actorId: input.actor.uid,
    note: `Amount mismatch reviewed: ${note}`,
  });

  await addActivity({
    applicationId: order.applicationId,
    type: "note",
    actorId: input.actor.uid,
    actorName: input.actor.email,
    visibility: "internal",
    message: `Payment mismatch reviewed before filing. ${note}`,
  });

  return updated;
}

export async function attachProviderRef(orderId: string, providerRef: string): Promise<void> {
  await getStore().merge<OrderRecord>(ORDERS, orderId, {
    providerRef,
    updatedAt: nowIso(),
  });
}

export async function markCardPaid(input: {
  orderId: string;
  providerRef: string;
  idempotencyKey: string;
}): Promise<OrderRecord> {
  const order = await getOrder(input.orderId);
  if (!order) throw new Error("Order not found");
  if (order.method !== "card") throw new Error("This order is not a card order.");
  if (order.providerRef && order.providerRef !== input.providerRef) {
    throw new Error("Provider reference does not match this order.");
  }

  if (order.status === "paid") return order;

  const updated = await transition(order, "paid", {
    paidAt: nowIso(),
    providerRef: input.providerRef,
  });

  await appendPaymentEvent({
    orderId: order.id,
    applicationId: order.applicationId,
    type: "paid",
    amountCents: order.amountCents,
    actorType: "provider",
    actorId: null,
    note: input.providerRef,
    idempotencyKey: input.idempotencyKey,
  });

  await addActivity({
    applicationId: order.applicationId,
    type: "payment_paid",
    actorId: null,
    actorName: "Provider",
    visibility: "client",
    message: "Pagesa me kartë u konfirmua.",
  });

  return updated;
}

export async function refundOrder(input: {
  orderId: string;
  reason: string;
  actor: { uid: string; email: string };
}): Promise<OrderRecord> {
  const order = await getOrder(input.orderId);
  if (!order) throw new Error("Order not found");
  if (order.method !== "cash") {
    throw new Error("Card refunds must be performed with the payment provider.");
  }
  const updated = await transition(order, "refunded", {
    refundedAt: nowIso(),
    refundReason: input.reason,
  });
  await appendPaymentEvent({
    orderId: order.id,
    applicationId: order.applicationId,
    type: "refunded",
    amountCents: order.amountCents,
    actorType: "staff",
    actorId: input.actor.uid,
    note: input.reason,
  });
  await addActivity({
    applicationId: order.applicationId,
    type: "payment_refunded",
    actorId: input.actor.uid,
    actorName: input.actor.email,
    visibility: "client",
    message: `Pagesa u rimbursua. Arsyeja: ${input.reason}`,
  });
  return updated;
}

export async function countCashOutstanding(): Promise<{ count: number; totalCents: number }> {
  const orders = await listOrders();
  return orders
    .filter((order) => order.status === "pending_cash")
    .reduce(
      (acc, order) => ({ count: acc.count + 1, totalCents: acc.totalCents + order.amountCents }),
      { count: 0, totalCents: 0 },
    );
}
