import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
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
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-page py-10 md:py-12">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-forest-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.legal.backHome}
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="eyebrow">{t.legal.lastUpdated} · {version}</p>
              <h1 className="display mt-3 text-[clamp(1.9rem,4vw,2.7rem)]">{title}</h1>
              <p className="lede mt-4 max-w-2xl text-[14.5px]">{intro}</p>
            </div>
            <span className="stamp w-fit border-clay-300 px-3 py-1.5 text-clay-600">{t.legal.draftNotice.split("—")[0].trim()}</span>
          </div>

          <p className="mt-6 max-w-3xl border-l-2 border-clay pl-4 text-[12.5px] leading-6 text-muted">
            {t.legal.draftNotice}
          </p>
        </div>
      </header>

      <div className="container-page py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={title} className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <p className="eyebrow-muted text-[10px]">{t.legal.contents}</p>
            <ol className="mt-4 space-y-2 border-l border-line">
              {sections.map((section, index) => (
                <li key={section.title.en}>
                  <a
                    href={`#section-${index + 1}`}
                    className="-ml-px flex gap-2 border-l border-transparent py-0.5 pl-3 text-[12.5px] leading-5 text-muted transition-colors hover:border-clay hover:text-forest-800"
                  >
                    <span className="font-mono text-3xs tabular text-clay-600" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title[locale]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0">
            {sections.map((section, index) => (
              <section key={section.title.en} id={`section-${index + 1}`} className="scroll-mt-28 border-t border-line py-7 first:border-t-0 first:pt-0">
                <div className="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6">
                  <span className="font-mono text-3xs tabular text-clay-600 sm:pt-1.5" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="prose-gck">
                    <h2 className="!mt-0 font-serif text-[21px] font-medium leading-snug tracking-[-0.01em] text-forest-900">
                      {section.title[locale]}
                    </h2>
                    <div className="mt-2.5 space-y-3">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph.en} className="!mb-0">
                          {paragraph[locale]}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}

            <div className="mt-10 border border-line bg-paper p-5">
              <p className="eyebrow-muted text-[10px]">{t.legal.controller}</p>
              <p className="mt-2 font-serif text-[18px] leading-snug text-forest-900">{address}</p>
              <a href={`mailto:${contactEmail}`} className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-clay-600">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
