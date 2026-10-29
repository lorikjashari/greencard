"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Staff-facing failure boundary. No applicant data is rendered here — only the
 * error digest, so a broken query never leaks rows into the UI.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl border border-line bg-paper p-7">
      <p className="eyebrow-muted text-[10px]">Admin · error</p>
      <h1 className="display mt-3 text-[26px] leading-tight">Kjo pamje nuk u ngarkua.</h1>
      <p className="mt-2 text-[13px] leading-6 text-muted">
        The view could not be loaded. The operation may not have been applied — re-check the record before retrying a
        money or filing action.
      </p>
      {error.digest && <p className="mt-3 font-mono text-[11px] text-muted">Digest: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="btn-primary btn-sm">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Provo përsëri
        </button>
        <Link href="/admin" className="btn-secondary btn-sm">
          Përmbledhje
        </Link>
      </div>
    </div>
  );
}
