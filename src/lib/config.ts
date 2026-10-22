import "server-only";

import { isFirebaseConfigured } from "@/lib/firebase/admin";

export type AppMode = "demo" | "firebase";

export interface PublicConfig {
  appUrl: string;
  defaultLocale: "sq" | "en";
  mode: AppMode;
  demo: boolean;
  firebaseConfigured: boolean;
  cardPaymentsEnabled: boolean;
  emailConfigured: boolean;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  dv: {
    year: number;
    opensAt: string;
    closesAt: string;
    instructionsUrl: string;
    photoRulesVersion: string;
  };
}

export function getAppMode(): AppMode {
  const explicit = process.env.APP_MODE?.trim().toLowerCase();
  if (explicit === "firebase") return "firebase";
  if (explicit === "demo") return "demo";
  return isFirebaseConfigured() ? "firebase" : "demo";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

export function cardPaymentsEnabled(): boolean {
  return (
    process.env.PAYMENT_PROVIDER === "stripe" &&
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  );
}

export function emailConfigured(): boolean {
  return (
    process.env.EMAIL_PROVIDER === "resend" &&
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.EMAIL_FROM)
  );
}

function defaultAppUrl(): string {
  const production =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : undefined;
  const host = (production ?? process.env.VERCEL_URL ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return host ? `https://${host}` : "http://localhost:3000";
}

export function getPublicConfig(): PublicConfig {
  const mode = getAppMode();
  return {
    appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl()).replace(/\/+$/, ""),
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE === "en" ? "en" : "sq",
    mode,
    demo: mode === "demo",
    firebaseConfigured: isFirebaseConfigured(),
    cardPaymentsEnabled: cardPaymentsEnabled(),
    emailConfigured: emailConfigured(),
    contact: {
      email: process.env.CONTACT_EMAIL ?? "info@greencardkosova.com",
      phone: process.env.CONTACT_PHONE ?? "+383 44 151 335",
      address: process.env.OFFICE_ADDRESS ?? "Rr. Eqrem Qabej Nr. 112, 10000 Prishtinë",
    },
    dv: {
      year: Number(process.env.DV_ACTIVE_YEAR ?? 2027),
      opensAt: process.env.DV_OPENS_AT ?? "2026-10-01T00:00:00Z",
      closesAt: process.env.DV_CLOSES_AT ?? "2026-11-04T23:59:59Z",
      instructionsUrl: process.env.DV_INSTRUCTIONS_URL ?? "https://dvprogram.state.gov/",
      photoRulesVersion: process.env.DV_PHOTO_RULES_VERSION ?? "2027.1",
    },
  };
}

/**
 * Startup check used by /api/health and the launch checklist.
 * Never returns or logs secret values.
 */
export function auditProductionReadiness(): Array<{ key: string; ok: boolean; detail: string }> {
  const mode = getAppMode();
  return [
    {
      key: "session_secret",
      ok: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
      detail: "SESSION_SECRET must be at least 32 characters.",
    },
    {
      key: "app_mode",
      ok: mode === "firebase",
      detail:
        mode === "firebase"
          ? "Firebase backend selected."
          : "Demo backend is active; data is local and emails are not delivered.",
    },
    {
      key: "firebase_admin",
      ok: isFirebaseConfigured(),
      detail: "FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.",
    },
    {
      key: "storage",
      ok: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      detail: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required for private photo storage.",
    },
    {
      key: "email",
      ok: emailConfigured(),
      detail: "EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM are required for real delivery.",
    },
    {
      key: "payments",
      ok: cardPaymentsEnabled(),
      detail: "PAYMENT_PROVIDER=stripe, STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required for card payments.",
    },
    {
      key: "app_url",
      ok: Boolean(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")),
      detail: "NEXT_PUBLIC_APP_URL must be the public HTTPS origin in production.",
    },
  ];
}
