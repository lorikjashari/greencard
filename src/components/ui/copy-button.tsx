"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  label,
  copiedLabel,
  failedLabel = "Copy failed",
  className,
  compact = false,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  failedLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        if (!ok) throw new Error("copy_failed");
      }
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }
  const copied = state === "copied";
  const failed = state === "failed";

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-2xs font-semibold text-ink transition-colors hover:border-forest-300 hover:bg-forest-50",
        compact && "px-1.5 py-0.5",
        className,
      )}
      aria-live="polite"
    >
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : failed ? (
        <X className="h-3 w-3 text-danger" />
      ) : (
        <Copy className="h-3 w-3 text-muted" />
      )}
      <span>{copied ? copiedLabel : failed ? failedLabel : label}</span>
    </button>
  );
}
