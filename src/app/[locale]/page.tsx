import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { copy } from "@/messages/get";
import { getPublicConfig } from "@/lib/config";
import { formatCurrency } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/repo/settings";

export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "sq";
  const t = copy(locale);
  const config = getPublicConfig();
  const settings = await getSettings();

  const steps = [
    { icon: UserRound, title: t.home.step1Title, body: t.home.step1Body },
    { icon: FileText, title: t.home.step2Title, body: t.home.step2Body },
    { icon: Upload, title: t.home.step3Title, body: t.home.step3Body },
    { icon: ClipboardCheck, title: t.home.step4Title, body: t.home.step4Body },
    { icon: CreditCard, title: t.home.step5Title, body: t.home.step5Body },
    { icon: BadgeCheck, title: t.home.step6Title, body: t.home.step6Body },
    { icon: ShieldCheck, title: t.home.step7Title, body: t.home.step7Body },
  ];

  const packages = [
    {
      key: "individual" as const,
      label: t.common.pkgIndividual,
      price: settings.prices.individual,
      desc: t.home.individualDesc,
    },
    {
      key: "couple" as const,
      label: t.common.pkgCouple,
      price: settings.prices.couple,
      desc: t.home.coupleDesc,
    },
    {
      key: "family" as const,
      label: t.common.pkgFamily,
      price: settings.prices.family,
      desc: t.home.familyDesc,
    },
  ];

  const faqs = [
    { q: t.home.faq1Q, a: t.home.faq1A },
    { q: t.home.faq2Q, a: t.home.faq2A },
    { q: t.home.faq3Q, a: t.home.faq3A },
    { q: t.home.faq4Q, a: t.home.faq4A },
    { q: t.home.faq5Q, a: t.home.faq5A },
    { q: t.home.faq6Q, a: t.home.faq6A },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-ivory">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60rem 32rem at 78% -10%, rgba(21,61,50,0.10), transparent 60%), radial-gradient(40rem 24rem at 10% 110%, rgba(197,165,106,0.12), transparent 65%)",
          }}
        />
        <div className="container-page relative grid gap-12 pb-16 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-fade-in">
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1 className="mt-4 max-w-2xl font-serif text-[2.35rem] leading-[1.08] tracking-[-0.02em] text-forest-900 sm:text-5xl lg:text-[3.4rem]">
              {t.home.h1}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-muted sm:text-[17px]">{t.home.sub}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/apply`} className="btn-primary min-h-12 px-6 text-[15px]">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary min-h-12 px-6 text-[15px]">
                {t.home.ctaSecondary}
              </Link>
            </div>

            <ul className="mt-9 grid gap-2.5 text-sm text-ink/75 sm:grid-cols-2">
              {[t.home.trust1, t.home.trust2, t.home.trust3, t.home.trust4].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Case-file visual */}
          <div className="relative animate-fade-in lg:pl-4">
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-forest/10 via-transparent to-gold/15 blur-2xl" aria-hidden="true" />
            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  GCK · DV {config.dv.year}
                </span>
                <span className="chip border-forest-200 bg-forest-50 text-forest-700">Aktiv</span>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-muted">{t.complete.reference}</span>
                  <span className="font-mono text-sm font-semibold tracking-wide text-ink">GCK-7F3K2</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-muted">{t.complete.package}</span>
                  <span className="text-sm font-medium text-ink">{t.common.pkgIndividual}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-muted">{t.complete.amount}</span>
                  <span className="text-sm font-semibold text-ink">{formatCurrency(settings.prices.individual, locale)}</span>
                </div>

                <div className="rounded-md border border-line bg-ivory/70 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {t.apply.progress}
                  </p>
                  <ol className="mt-3 space-y-2.5">
                    {[
                      { label: t.apply.step1, done: true },
                      { label: t.apply.step2, done: true },
                      { label: t.apply.step6, done: true },
                      { label: t.apply.step8, done: false },
                    ].map((step, index) => (
                      <li key={step.label} className="flex items-center gap-2.5 text-[13px]">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                            step.done
                              ? "border-forest bg-forest text-white"
                              : "border-line bg-white text-muted"
                          }`}
                        >
                          {step.done ? <Check className="h-3 w-3" /> : index + 1}
                        </span>
                        <span className={step.done ? "text-ink" : "text-muted"}>{step.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-line bg-white px-5 py-3 text-[11px] text-muted">
                <Lock className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
                {t.apply.photosIntro}
              </div>
            </div>
            <p className="mt-3 px-1 text-[11px] text-muted/80">{t.common.demoBanner.split(".")[0]}.</p>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section aria-labelledby="disclosure-title" className="border-b border-line bg-white">
        <div className="container-page py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="max-w-4xl">
              <h2 id="disclosure-title" className="text-sm font-semibold text-ink">
                {t.home.disclosureTitle}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{t.home.disclosureBody}</p>
              <a
                href={config.dv.instructionsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="link mt-1 inline-block text-[13px]"
              >
                {t.home.officialLink} ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-line">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">{t.home.howEyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
              {t.home.howTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted">{t.home.howSub}</p>
          </div>

          <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-forest-200 bg-white text-forest shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-6 text-muted">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="scroll-mt-20 border-b border-line bg-white">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">{t.home.pricingEyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
              {t.home.pricingTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted">{t.home.pricingSub}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                className="relative flex flex-col rounded-lg border border-line bg-white p-6 transition-colors hover:border-forest-300"
              >
                <h3 className="text-[15px] font-semibold text-ink">{pkg.label}</h3>
                <p className="mt-1.5 min-h-10 text-[13px] leading-6 text-muted">{pkg.desc}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-serif text-4xl tracking-tight text-forest-900">
                    {formatCurrency(pkg.price, locale)}
                  </span>
                  <span className="text-xs text-muted">{t.common.perApplication}</span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-forest-600">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.home.calculated}
                </p>
                <Link
                  href={`/${locale}/apply`}
                  className="btn-secondary mt-6 w-full"
                  aria-label={`${t.home.compareCta} — ${pkg.label}`}
                >
                  {t.nav.apply}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-xs leading-6 text-muted">{t.home.pricingNote}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-line">
        <div className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">{t.home.faqEyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
              {t.home.faqTitle}
            </h2>
            <Link href={`/${locale}/faq`} className="link mt-5 inline-block text-sm">
              {t.home.faqLink} →
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-medium text-ink marker:hidden">
                  {faq.q}
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2.5 pr-10 text-[13.5px] leading-6 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + final CTA */}
      <section className="container-page py-16 md:py-20">
        <div className="overflow-hidden rounded-xl bg-forest-900 text-white">
          <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-[1.2fr_1fr] md:p-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{t.home.contactEyebrow}</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-white sm:text-4xl">
                {t.home.finalTitle}
              </h2>
              <p className="mt-3 max-w-lg text-[15px] leading-7 text-white/70">{t.home.finalBody}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={`/${locale}/apply`} className="btn bg-white text-forest hover:bg-ivory">
                  {t.home.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="btn border border-white/25 text-white hover:bg-white/10"
                >
                  {t.home.contactCta}
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/[0.04] p-5">
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-white/85">{config.contact.email}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-white/85">{config.contact.phone}</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-white/85">{config.contact.address}</span>
                </li>
              </ul>
              <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-white/50">
                {t.home.footerDisclaimer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
