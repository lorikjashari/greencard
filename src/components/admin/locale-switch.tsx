"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function AdminLocaleSwitch({
  locale,
  tone = "dark",
}: {
  locale: "sq" | "en";
  tone?: "dark" | "light";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(next: "sq" | "en") {
    if (next === locale || busy) return;
    setBusy(next);
    try {
      await fetch("/api/admin/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      role="group"
      aria-label="Gjuha / Language"
      className={cn(
        "inline-flex items-center rounded-sm border p-0.5 font-mono text-3xs uppercase",
        tone === "dark" ? "border-white/15" : "border-line-strong",
      )}
      style={{ letterSpacing: "0.12em" }}
    >
      {(["sq", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => void choose(code)}
          aria-pressed={locale === code}
          disabled={busy !== null}
          className={cn(
            "px-1.5 py-0.5 transition-colors disabled:opacity-60",
            locale === code
              ? tone === "dark"
                ? "bg-paper text-forest-900"
                : "bg-forest-800 text-paper"
              : tone === "dark"
                ? "text-paper/50 hover:text-paper"
                : "text-muted hover:text-ink",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
