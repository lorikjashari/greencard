"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase/client";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";

const EMAIL_KEY = "gck_firebase_email";

export function FirebaseLogin({ locale, t }: { locale: Locale; t: Copy }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const configured = firebaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const auth = firebaseAuth();
    if (!auth) return;

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = window.localStorage.getItem(EMAIL_KEY) ?? "";
      if (!stored) {
        setNeedsEmail(true);
        setStatus("idle");
        return;
      }
      void complete(stored, window.location.href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  async function complete(address: string, href: string) {
    const auth = firebaseAuth();
    if (!auth) return;
    setStatus("verifying");
    setMessage(null);
    try {
      const credential = await signInWithEmailLink(auth, address, href);
      const idToken = await credential.user.getIdToken();
      window.localStorage.removeItem(EMAIL_KEY);

      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        role?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(
          payload.error === "inactive"
            ? t.auth.pendingApproval
            : payload.error ?? t.errors.generic,
        );
        return;
      }
      router.push(payload.role === "client" ? `/${locale}/account` : "/admin");
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message || t.errors.generic);
    }
  }

  async function sendLink() {
    const auth = firebaseAuth();
    if (!auth) {
      setStatus("error");
      setMessage("Firebase Authentication nuk është konfiguruar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus("error");
      setMessage(t.auth.invalidEmail);
      return;
    }

    setStatus("sending");
    setMessage(null);
    try {
      await sendSignInLinkToEmail(auth, email.trim(), {
        url: `${window.location.origin}/${locale}/login`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_KEY, email.trim());
      setStatus("sent");
      setMessage(t.auth.genericSent);
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message || t.errors.generic);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
        Firebase Authentication nuk është konfiguruar. Plotëso `NEXT_PUBLIC_FIREBASE_*` për të aktivizuar hyrjen
        me email.
      </div>
    );
  }

  if (needsEmail) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{t.auth.loginIntro}</p>
        <label className="label" htmlFor="firebase-email">
          {t.common.email}
        </label>
        <input
          id="firebase-email"
          type="email"
          className="field"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => void complete(email.trim(), window.location.href)}
        >
          {t.auth.sendLink}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{t.auth.loginIntro}</p>
      <div>
        <label className="label" htmlFor="firebase-email">
          {t.common.email}
        </label>
        <input
          id="firebase-email"
          type="email"
          className="field"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          aria-invalid={status === "error" ? true : undefined}
        />
      </div>
      <button
        type="button"
        onClick={() => void sendLink()}
        disabled={status === "sending" || status === "verifying"}
        className="btn-primary w-full"
      >
        {status === "sending" || status === "verifying" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {t.auth.sendLink}
      </button>
      {message && (
        <p
          className={`flex items-start gap-2 rounded-md border p-3 text-[13px] leading-5 ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-forest-200 bg-forest-50 text-forest-800"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "error" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
}
