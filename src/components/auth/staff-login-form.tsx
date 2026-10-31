"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export function StaffLoginForm({ locale, t }: { locale: Locale; t: Copy }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function reset(next: "password" | "link") {
    setMode(next);
    setStatus("idle");
    setMessage(null);
    setPassword("");
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setStatus("busy");
    setMessage(null);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, locale }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        role?: Role;
        error?: string;
        locked?: boolean;
      };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.locked ? t.auth.passwordLocked : (payload.error ?? t.auth.passwordWrong));
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(t.errors.network);
    }
  }

  async function requestLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("busy");
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

  return (
    <div className="space-y-5">
      {message && (
        <p
          className={`flex items-start gap-2 border-l-2 px-3.5 py-2.5 text-[12.5px] leading-5 ${
            status === "error"
              ? "border-danger bg-danger-50 text-danger"
              : "border-forest-400 bg-forest-50 text-forest-800"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "error" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {message}
        </p>
      )}

      {mode === "password" ? (
        <form onSubmit={signIn} className="space-y-4">
          <div>
            <label className="label" htmlFor="staff-email">
              {t.common.email}
            </label>
            <input
              id="staff-email"
              type="email"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              aria-invalid={status === "error" ? true : undefined}
            />
          </div>
          <div>
            <label className="label" htmlFor="staff-password">
              {t.auth.passwordLabel}
            </label>
            <input
              id="staff-password"
              type="password"
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              aria-invalid={status === "error" ? true : undefined}
            />
            <p className="hint">{t.auth.passwordIntro}</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={status === "busy"}>
            {status === "busy" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            {status === "busy" ? t.auth.passwordSigningIn : t.auth.passwordSignIn}
          </button>
          <button
            type="button"
            onClick={() => reset("link")}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {t.auth.useEmailLink}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <form onSubmit={requestLink} className="space-y-4">
          <div>
            <label className="label" htmlFor="staff-link-email">
              {t.common.email}
            </label>
            <input
              id="staff-link-email"
              type="email"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              aria-invalid={status === "error" ? true : undefined}
            />
            <p className="hint">{t.auth.adminIntro}</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={status === "busy"}>
            {status === "busy" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="h-4 w-4" aria-hidden="true" />
            )}
            {status === "busy" ? t.auth.sending : t.auth.sendLink}
          </button>
          <button
            type="button"
            onClick={() => reset("password")}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {t.auth.usePassword}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
