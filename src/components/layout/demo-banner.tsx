import Link from "next/link";
import { FlaskConical } from "lucide-react";
import type { Copy } from "@/messages/get";

export function DemoBanner({ t }: { t: Copy }) {
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[12px] leading-5 text-amber-900">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          <FlaskConical className="h-3 w-3" aria-hidden="true" />
          {t.common.demoBadge}
        </span>
        <span className="flex-1">{t.common.demoBanner}</span>
        <Link href="/admin/outbox" className="font-medium underline underline-offset-2">
          {t.common.demoBannerCta}
        </Link>
      </div>
    </div>
  );
}
