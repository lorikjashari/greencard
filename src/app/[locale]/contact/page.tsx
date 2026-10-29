import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPublicConfig } from "@/lib/config";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Kontakti",
  description: "Kontakto Green Card Kosova për pyetje rreth aplikimit DV, pagesës ose portalit.",
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);
  const config = getPublicConfig();

  return (
    <div>
      <PageHeader
        eyebrow={t.legal.contactTitle}
        title={pick(locale, "Bisedo me një njeri.", "Talk to a person.")}
        lede={pick(
          locale,
          "Për pyetje rreth aplikimit, pagesës ose portalit, na shkruaj ose telefono. Nuk japim këshilla ligjore ose imigrimi dhe nuk garantojmë rezultate.",
          "For questions about your application, payment or the portal, write or call us. We do not provide legal or immigration advice, and we do not guarantee outcomes.",
        )}
      />

      <div className="container-page py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          {/* Direct channels, set as type rather than icon cards. */}
          <div className="border-t border-line">
            <a
              href={`mailto:${config.contact.email}`}
              className="group flex items-baseline justify-between gap-6 border-b border-line py-6 transition-colors hover:bg-paper"
            >
              <span>
                <span className="meta text-[10px] block">{t.common.email}</span>
                <span className="mt-1.5 block break-all font-serif text-[clamp(1.25rem,2.6vw,1.75rem)] leading-tight text-forest-900 decoration-clay/60 decoration-1 underline-offset-4 group-hover:underline">
                  {config.contact.email}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-clay-600" aria-hidden="true" />
            </a>

            <a
              href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
              className="group flex items-baseline justify-between gap-6 border-b border-line py-6 transition-colors hover:bg-paper"
            >
              <span>
                <span className="meta text-[10px] block">{t.common.phone}</span>
                <span className="mt-1.5 block font-serif text-[clamp(1.25rem,2.6vw,1.75rem)] leading-tight tabular text-forest-900 decoration-clay/60 decoration-1 underline-offset-4 group-hover:underline">
                  {config.contact.phone}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-clay-600" aria-hidden="true" />
            </a>

            <div className="border-b border-line py-6">
              <span className="meta text-[10px] block">{pick(locale, "Zyra", "Office")}</span>
              <p className="mt-1.5 max-w-sm font-serif text-[19px] leading-snug text-forest-900">{config.contact.address}</p>
            </div>

            <div className="py-6">
              <span className="meta text-[10px] block">{pick(locale, "Përgjigja", "Response")}</span>
              <p className="mt-1.5 max-w-md text-[13px] leading-6 text-muted">
                {pick(
                  locale,
                  "Përgjigjemi gjatë orarit të punës. Orari zyrtar i zyrës do të publikohet pasi të konfirmohet; nëse ke nevojë urgjente, telefono.",
                  "We reply during working hours. The official office hours will be published once confirmed; if your need is urgent, call.",
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${locale}/apply`} className="btn-primary">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/faq`} className="btn-secondary">
                {t.legal.faqTitle}
              </Link>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border border-line bg-paper p-5">
              <p className="text-[13px] font-semibold text-forest-900">{t.home.disclosureTitle}</p>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{t.home.disclosureBody}</p>
              <a
                href={config.dv.instructionsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="link mt-3 inline-block text-[12.5px]"
              >
                {t.home.officialLink} ↗
              </a>
            </div>

            <div className="border border-line bg-paper p-5">
              <p className="meta text-[10px]">{t.home.windowLabel}</p>
              <p className="mt-2 font-mono text-[12px] tabular text-ink">
                DV {config.dv.year}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                {pick(locale, "Datat publikohen nga udhëzimet zyrtare.", "Dates are published in the official instructions.")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
