import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getPublicConfig } from "@/lib/config";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

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
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">{t.legal.contactTitle}</p>
        <h1 className="mt-2 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
          {pick(locale, "Bisedo me një njeri.", "Talk to a person.")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {pick(
            locale,
            "Për pyetje rreth aplikimit, pagesës ose portalit, na shkruaj ose telefono. Nuk japim këshilla ligjore ose imigrimi dhe nuk garantojmë rezultate.",
            "For questions about your application, payment or the portal, write or call us. We do not provide legal or immigration advice, and we do not guarantee outcomes.",
          )}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${config.contact.email}`}
            className="group rounded-lg border border-line bg-white p-5 transition-colors hover:border-forest-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-50 text-forest">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-muted">
              {t.common.email}
            </p>
            <p className="mt-1 break-all text-[14px] font-medium text-ink group-hover:text-forest">
              {config.contact.email}
            </p>
          </a>

          <a
            href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
            className="group rounded-lg border border-line bg-white p-5 transition-colors hover:border-forest-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-50 text-forest">
              <Phone className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-muted">
              {t.common.phone}
            </p>
            <p className="mt-1 text-[14px] font-medium text-ink group-hover:text-forest">
              {config.contact.phone}
            </p>
          </a>

          <div className="rounded-lg border border-line bg-white p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-50 text-forest">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-muted">
              {pick(locale, "Zyra", "Office")}
            </p>
            <p className="mt-1 text-[14px] font-medium leading-6 text-ink">{config.contact.address}</p>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-50 text-forest">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-muted">
              {pick(locale, "Përgjigja", "Response")}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-muted">
              {pick(
                locale,
                "Përgjigjemi gjatë orarit të punës. Orari zyrtar i zyrës do të publikohet pasi të konfirmohet; nëse ke nevojë urgjente, telefono.",
                "We reply during working hours. The official office hours will be published once confirmed; if your need is urgent, call.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-forest-200 bg-forest-50/60 p-5">
          <p className="text-[13px] font-semibold text-forest-900">{t.home.disclosureTitle}</p>
          <p className="mt-2 text-[12.5px] leading-6 text-forest-800/90">{t.home.disclosureBody}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/${locale}/apply`} className="btn-primary">
            {t.home.ctaPrimary}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/faq`} className="btn-secondary">
            {t.legal.faqTitle}
          </Link>
        </div>
      </div>
    </div>
  );
}
