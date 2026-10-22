"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { FirebaseLogin } from "./firebase-login";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export interface DemoAccount {
  email: string;
  name: string;
  role: Role;
}

export function LoginForm({
  locale,
  t,
  demo,
  demoAccounts,
  firebaseMode,
  initialError,
  intro,
}: {
  locale: Locale;
  t: Copy;
  demo: boolean;
  demoAccounts: DemoAccount[];
  firebaseMode: boolean;
  initialError?: string;
  intro?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(
    initialError === "expired"
      ? t.auth.linkExpired
      : initialError === "inactive"
        ? t.auth.pendingApproval
        : initialError
          ? t.auth.linkInvalid
          : null,
  );
  const [demoBusy, setDemoBusy] = useState<string | null>(null);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const response = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? t.errors.generic);
        return;
      }
      setStatus("sent");
      setMessage(payload.message ?? t.auth.genericSent);
    } catch {
      setStatus("error");
      setMessage(t.errors.network);
    }
  }

  async function demoSignIn(account: DemoAccount) {
    setDemoBusy(account.email);
    setMessage(null);
    try {
      const endpoint = account.role === "client" ? "/api/auth/demo-client" : "/api/auth/staff";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      const payload = (await response.json()) as { ok: boolean; role?: Role; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? t.errors.generic);
        setDemoBusy(null);
        return;
      }
      router.push(payload.role === "client" ? `/${locale}/account` : "/admin");
    } catch {
      setMessage(t.errors.network);
      setDemoBusy(null);
    }
  }

  const roleLabel = (role: Role) =>
    role === "admin"
      ? t.admin.roleAdmin
      : role === "operator"
        ? t.admin.roleOperator
        : role === "accountant"
          ? t.admin.roleAccountant
          : t.admin.roleViewer;

  if (firebaseMode) {
    return <FirebaseLogin locale={locale} t={t} />;
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`flex items-start gap-2 rounded-md border p-3 text-[13px] leading-5 ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-forest-200 bg-forest-50 text-forest-800"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "error" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {message}
        </p>
      )}

      <form onSubmit={requestLink} className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">
            {t.common.email}
          </label>
          <input
            id="login-email"
            type="email"
            className="field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            aria-invalid={status === "error" ? true : undefined}
          />
          <p className="hint">{intro ?? t.auth.loginIntro}</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="h-4 w-4" aria-hidden="true" />
          )}
          {status === "sending" ? t.auth.sending : t.auth.sendLink}
        </button>
      </form>

      {demo && demoAccounts.length > 0 && (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t.auth.demoAccounts}
          </p>
          <p className="mt-1 text-2xs leading-5 text-amber-900/80">{t.auth.demoNote}</p>
          <div className="mt-3 space-y-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => void demoSignIn(account)}
                disabled={demoBusy !== null}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-[13px] transition-colors hover:border-amber-400 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{account.name}</span>
                  <span className="block truncate text-2xs text-muted">{account.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-amber-800">
                  {account.role === "client" ? t.admin.roleClient : roleLabel(account.role)}
                  {demoBusy === account.email ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
