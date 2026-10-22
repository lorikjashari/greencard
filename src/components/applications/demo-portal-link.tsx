"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";

/**
 * In demo mode the portal sign-in link is returned with the submission and
 * stashed in sessionStorage (emails are not delivered). This lets the flow be
 * tested end to end without pretending an email was sent.
 */
export function DemoPortalLink({ t, locale }: { t: Copy; locale: Locale }) {
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    try {
      const value = window.sessionStorage.getItem("gck_demo_portal");
      if (value && value.startsWith("/")) setLink(value);
    } catch {
      /* ignore */
    }
  }, []);

  if (!link) return null;

  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
        {t.complete.demoLinkTitle}
      </p>
      <Link
        href={link}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-900 underline decoration-amber-500 underline-offset-4"
      >
        {t.complete.portalCta}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      <p className="mt-2 text-2xs leading-5 text-amber-900/80">{t.complete.emailNotConfigured}</p>
      <p className="mt-1 text-2xs leading-5 text-amber-900/80">
        {locale === "sq"
          ? "E njëjta lidhje gjendet edhe në /admin/outbox."
          : "The same link is also available in /admin/outbox."}
      </p>
    </div>
  );
}
