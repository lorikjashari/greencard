import Link from "next/link";
import { FlaskConical } from "lucide-react";
import type { Copy } from "@/messages/get";

export function DemoBanner({ t }: { t: Copy }) {
  return (
    <div className="border-b border-clay-200 bg-clay-50" data-print="hide">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <span className="stamp shrink-0 border-clay-400 text-clay-700">
          <FlaskConical className="mr-1.5 h-3 w-3" aria-hidden="true" />
          {t.common.demoBadge}
        </span>
        <span className="flex-1 text-[11.5px] leading-5 text-clay-700">{t.common.demoBanner}</span>
        <Link
          href="/admin/outbox"
          className="font-mono text-[10px] uppercase text-clay-700 underline decoration-clay-400 underline-offset-2 hover:text-clay-600"
          style={{ letterSpacing: "0.1em" }}
        >
          {t.common.demoBannerCta} ↗
        </Link>
      </div>
    </div>
  );
}
