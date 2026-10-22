import "server-only";

import type { ApplicationRecord, Locale, OrderRecord } from "@/lib/types";

export interface CheckoutInput {
  order: OrderRecord;
  application: ApplicationRecord;
  locale: Locale;
}

export interface CheckoutResult {
  url: string;
  providerRef: string;
}

export interface WebhookResult {
  eventId: string;
  orderId: string;
  providerRef: string;
  paid: boolean;
  amountCents: number | null;
  currency: string | null;
}

/**
 * Payment provider boundary. Card payment is disabled unless a real provider
 * is configured; there is no mock provider because a simulated success state
 * would be unsafe.
 */
export interface PaymentProvider {
  readonly key: "stripe";
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  parseWebhook(rawBody: string, signature: string | null): Promise<WebhookResult | null>;
  retrieveCheckout(providerRef: string): Promise<{
    paid: boolean;
    orderId: string | null;
    amountCents: number | null;
    currency: string | null;
  }>;
}
