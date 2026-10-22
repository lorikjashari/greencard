import "server-only";

import Stripe from "stripe";
import { cardPaymentsEnabled, getPublicConfig } from "@/lib/config";
import type { CheckoutInput, CheckoutResult, PaymentProvider, WebhookResult } from "./provider";

class StripeProvider implements PaymentProvider {
  readonly key = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const config = getPublicConfig();
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.application.contact.email,
      client_reference_id: input.order.id,
      metadata: {
        orderId: input.order.id,
        applicationId: input.application.id,
        reference: input.application.ref,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: input.order.amountCents,
            product_data: {
              name: `Green Card Kosova — ${input.application.ref}`,
              description:
                input.locale === "sq"
                  ? "Shërbim i pavarur përgatitjeje aplikimi; nuk është faqja zyrtare e qeverisë amerikane."
                  : "Independent application preparation service; not the official US government site.",
            },
          },
        },
      ],
      success_url: `${config.appUrl}/api/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}&order=${input.order.id}`,
      cancel_url: `${config.appUrl}/${input.locale}/account/${input.application.id}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url, providerRef: session.id };
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<WebhookResult | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    if (!signature) throw new Error("Missing Stripe signature.");

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    if (event.type !== "checkout.session.completed") return null;

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return null;

    return {
      eventId: event.id,
      orderId,
      providerRef: session.id,
      paid: session.payment_status === "paid",
      amountCents: session.amount_total,
      currency: session.currency,
    };
  }

  async retrieveCheckout(providerRef: string): Promise<{
    paid: boolean;
    orderId: string | null;
    amountCents: number | null;
    currency: string | null;
  }> {
    const session = await this.stripe.checkout.sessions.retrieve(providerRef);
    return {
      paid: session.payment_status === "paid",
      orderId: session.metadata?.orderId ?? null,
      amountCents: session.amount_total,
      currency: session.currency,
    };
  }
}

export function getPaymentProvider(): PaymentProvider | null {
  if (!cardPaymentsEnabled()) return null;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  return new StripeProvider(secret);
}

/**
 * Stripe does not currently support merchants established in Kosovo. This
 * adapter is intentionally provider-complete but stays disabled until a PSP
 * or merchant structure that can legally operate is selected and configured.
 */
export const STRIPE_KOSOVO_LIMITATION =
  "Stripe does not support Kosovo-based merchants. Card payments remain disabled until an eligible PSP/merchant structure is configured.";
