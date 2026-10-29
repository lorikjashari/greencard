"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest so support can match a report to server logs.
    console.error("Locale route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] items-center py-16">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-clay" aria-hidden="true" />
          <p className="eyebrow">Gabim / Error</p>
        </div>
        <h1 className="display mt-5 text-[clamp(1.7rem,4vw,2.4rem)]">
          Diçka shkoi keq.
          <span className="block font-normal text-muted">Something went wrong.</span>
        </h1>
        <p className="lede mt-4 max-w-md text-[14px]">
          Progresi i aplikimit ruhet automatikisht. Provo përsëri; nëse vazhdon, kontakto zyrën me referencën e dosjes.
          Your draft is saved — try again, or contact the office with your file reference.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-muted">Ref: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Provo përsëri
          </button>
          <Link href="/sq" className="btn-secondary">
            Kthehu në faqen kryesore
          </Link>
        </div>
      </div>
    </div>
  );
}
