import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOrder, markCardPaid } from "@/lib/repo/orders";
import { getApplication } from "@/lib/repo/applications";
import { logAudit } from "@/lib/repo/audit";
import { getPaymentProvider } from "@/lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser return target. It verifies the session with the provider before
 * marking anything paid; the webhook remains the primary confirmation path.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const orderId = request.nextUrl.searchParams.get("order");
  const fallback = new URL("/sq/account", request.url);

  if (!sessionId || !orderId) {
    return NextResponse.redirect(fallback);
  }

  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.redirect(new URL("/sq/account?payment=unavailable", request.url));
  }

  const order = await getOrder(orderId);
  if (!order) return NextResponse.redirect(fallback);

  const application = await getApplication(order.applicationId);
  const locale = application?.locale ?? "sq";
  const target = new URL(`/${locale}/account/${order.applicationId}`, request.url);

  try {
    const result = await provider.retrieveCheckout(sessionId);
    if (
      !result.paid ||
      result.orderId !== order.id ||
      result.amountCents !== order.amountCents ||
      result.currency?.toLowerCase() !== order.currency.toLowerCase()
    ) {
      target.searchParams.set("payment", "pending");
      return NextResponse.redirect(target);
    }

    await markCardPaid({
      orderId: order.id,
      providerRef: sessionId,
      idempotencyKey: `stripe-return:${sessionId}`,
    });
    await logAudit({
      actor: { uid: "system:stripe", email: "stripe-return" },
      action: "payment.card_confirmed",
      entityType: "order",
      entityId: order.id,
      summary: `Card payment confirmed on return for ${order.ref}.`,
      metadata: { sessionId },
    });

    target.searchParams.set("payment", "paid");
    return NextResponse.redirect(target);
  } catch {
    target.searchParams.set("payment", "pending");
    return NextResponse.redirect(target);
  }
}
