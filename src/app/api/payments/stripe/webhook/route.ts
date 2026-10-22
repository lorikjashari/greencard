import type { NextRequest } from "next/server";
import { getOrder, markCardPaid } from "@/lib/repo/orders";
import { getApplication } from "@/lib/repo/applications";
import { logAudit } from "@/lib/repo/audit";
import { getPaymentProvider } from "@/lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authoritative card payment confirmation. The application is never marked
 * paid from a browser redirect or client-side state.
 */
export async function POST(request: NextRequest) {
  const provider = getPaymentProvider();
  if (!provider) {
    return Response.json({ error: "Card payments are not configured." }, { status: 503 });
  }

  const raw = await request.text();
  let parsed: Awaited<ReturnType<typeof provider.parseWebhook>>;

  try {
    parsed = await provider.parseWebhook(raw, request.headers.get("stripe-signature"));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  if (!parsed || !parsed.paid) {
    return Response.json({ received: true, ignored: true });
  }

  const order = await getOrder(parsed.orderId);
  if (!order) {
    // Return 200 so the provider does not retry an event we can never map.
    return Response.json({ received: true, ignored: "unknown_order" });
  }

  if (
    order.method !== "card" ||
    parsed.amountCents !== order.amountCents ||
    parsed.currency?.toLowerCase() !== order.currency.toLowerCase()
  ) {
    await logAudit({
      actor: { uid: "system:stripe", email: "stripe-webhook" },
      action: "payment.provider_mismatch",
      entityType: "order",
      entityId: order.id,
      summary: `Ignored a provider event that does not match order ${order.ref}.`,
      metadata: {
        providerRef: parsed.providerRef,
        expectedAmountCents: order.amountCents,
        receivedAmountCents: parsed.amountCents,
        expectedCurrency: order.currency,
        receivedCurrency: parsed.currency,
        method: order.method,
      },
    });
    return Response.json({ received: true, ignored: "order_mismatch" });
  }

  await markCardPaid({
    orderId: order.id,
    providerRef: parsed.providerRef,
    idempotencyKey: `stripe:${parsed.eventId}`,
  });

  const application = await getApplication(order.applicationId);
  await logAudit({
    actor: { uid: "system:stripe", email: "stripe-webhook" },
    action: "payment.card_confirmed",
    entityType: "order",
    entityId: order.id,
    summary: `Card payment confirmed for ${order.ref}.`,
    metadata: { providerRef: parsed.providerRef, applicationRef: application?.ref ?? null },
  });

  return Response.json({ received: true });
}
