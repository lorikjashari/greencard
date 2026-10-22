import Link from "next/link";
import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";

export interface LegalSection {
  title: { sq: string; en: string };
  paragraphs: Array<{ sq: string; en: string }>;
}

export function LegalDocument({
  locale,
  t,
  title,
  intro,
  sections,
  version,
  contactEmail,
  address,
}: {
  locale: Locale;
  t: Copy;
  title: string;
  intro: string;
  sections: LegalSection[];
  version: string;
  contactEmail: string;
  address: string;
}) {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-forest"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t.legal.backHome}
        </Link>

        <h1 className="mt-6 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-2xs text-muted">
          {t.legal.lastUpdated}: {version}
        </p>
        <p className="mt-4 text-sm leading-7 text-ink/80">{intro}</p>

        <div className="mt-6 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.legal.draftNotice}</span>
        </div>

        <div className="mt-9 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title.en}>
              <h2 className="text-[15px] font-semibold text-forest-900">
                {index + 1}. {section.title[locale]}
              </h2>
              <div className="mt-2.5 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.en} className="text-[13px] leading-7 text-ink/80">
                    {paragraph[locale]}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-line bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t.legal.controller}</p>
          <p className="mt-2 text-[13px] font-medium text-ink">{address}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            <a href={`mailto:${contactEmail}`} className="link">
              {contactEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
