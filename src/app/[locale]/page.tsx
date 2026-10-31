import Link from "next/link";
import { ArrowRight, ArrowUpRight, Lock, Plus } from "lucide-react";
import { copy } from "@/messages/get";
import { getPublicConfig } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/repo/settings";
import { getActiveDvYear, isWindowOpen } from "@/lib/repo/dv-years";

export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "sq";
  const t = copy(locale);
  const config = getPublicConfig();
  const settings = await getSettings();
  const dvYear = await getActiveDvYear();
  const windowOpen = isWindowOpen(dvYear);

  const packages = [
    { key: "01", label: t.common.pkgIndividual, price: settings.prices.individual, desc: t.home.individualDesc },
    { key: "02", label: t.common.pkgCouple, price: settings.prices.couple, desc: t.home.coupleDesc },
    { key: "03", label: t.common.pkgFamily, price: settings.prices.family, desc: t.home.familyDesc },
  ];

  const steps = [
    { title: t.home.step1Title, body: t.home.step1Body },
    { title: t.home.step2Title, body: t.home.step2Body },
    { title: t.home.step3Title, body: t.home.step3Body },
    { title: t.home.step4Title, body: t.home.step4Body },
    { title: t.home.step5Title, body: t.home.step5Body },
    { title: t.home.step6Title, body: t.home.step6Body },
    { title: t.home.step7Title, body: t.home.step7Body },
  ];

  const faqs = [
    { q: t.home.faq1Q, a: t.home.faq1A },
    { q: t.home.faq2Q, a: t.home.faq2A },
    { q: t.home.faq3Q, a: t.home.faq3A },
    { q: t.home.faq4Q, a: t.home.faq4A },
    { q: t.home.faq5Q, a: t.home.faq5A },
    { q: t.home.faq6Q, a: t.home.faq6A },
  ];

  const facts = [
    { title: t.home.factFreeTitle, body: t.home.factFreeBody, href: config.dv.instructionsUrl, external: true },
    { title: t.home.factIndependentTitle, body: t.home.factIndependentBody },
    { title: t.home.factNoGuaranteeTitle, body: t.home.factNoGuaranteeBody },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/brand/background.webp')] bg-cover bg-center opacity-45"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-paper via-paper/92 to-paper/35"
        />
        <div className="container-page relative grid gap-12 pb-14 pt-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="animate-rise-in">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-clay" aria-hidden="true" />
              <p className="eyebrow">{t.home.eyebrow}</p>
            </div>

            <h1 className="display mt-6 text-[clamp(2.4rem,6.2vw,4.15rem)]">{t.home.h1}</h1>

            <p className="lede mt-6 max-w-[36rem]">{t.home.sub}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={`/${locale}/apply`} className="btn-primary min-h-12 px-6 text-[14px]">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary min-h-12 px-6 text-[14px]">
                {t.home.ctaSecondary}
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 border-t border-line pt-5 sm:grid-cols-4">
              {[t.home.trust1, t.home.trust2, t.home.trust3, t.home.trust4].map((item, index) => (
                <div key={item} className="py-2">
                  <dt className="font-mono text-3xs text-clay-600" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </dt>
                  <dd className="mt-1.5 text-[12.5px] leading-5 text-ink/80">{item}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Application dossier — the product, shown honestly. */}
          <div className="relative animate-rise-in [animation-delay:120ms]">
            <div className="absolute inset-0 translate-x-2 translate-y-2 border border-line/80 bg-paper/50" aria-hidden="true" />
            <div className="relative border border-line-strong bg-paper">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                <p className="meta text-[10px] text-forest-700">
                  GCK · DV {dvYear.year}
                </p>
                <span className={`stamp ${windowOpen ? "border-forest-300 text-forest-700" : "border-line-strong text-muted"}`}>
                  {windowOpen ? t.home.windowOpen : t.home.windowClosed}
                </span>
              </div>

              <div className="px-5 pb-5 pt-5">
                <p className="eyebrow-muted text-[10px]">{t.home.dossierLabel}</p>

                <dl className="mt-4 divide-y divide-line border-y border-line">
                  {[
                    { label: t.home.fileNumber, value: "GCK-7F3K2", mono: true },
                    { label: t.complete.package, value: t.common.pkgIndividual },
                    { label: t.complete.amount, value: formatCurrency(settings.prices.individual, locale), mono: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-[12.5px] text-muted">{row.label}</dt>
                      <dd className={`text-[13px] text-ink ${row.mono ? "font-mono tabular" : "font-medium"}`}>{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <p className="eyebrow-muted text-[10px]">{t.apply.progress}</p>
                    <p className="font-mono text-[10px] tabular text-muted">3 / 8</p>
                  </div>
                  <ol className="mt-3 space-y-2.5">
                    {[
                      { label: t.apply.step1, done: true },
                      { label: t.apply.step2, done: true },
                      { label: t.apply.step6, done: true },
                      { label: t.apply.step8, done: false },
                    ].map((step) => (
                      <li key={step.label} className="flex items-center gap-3">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                            step.done ? "border-forest bg-forest text-paper" : "border-line-strong text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5">
                            <path d="M1.5 5.2 4 7.5 8.5 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className={`text-[12.5px] ${step.done ? "text-ink" : "text-muted"}`}>{step.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-line px-5 py-2.5">
                <Lock className="h-3 w-3 text-forest-600" aria-hidden="true" />
                <p className="text-[11px] text-muted">{t.home.trust4}</p>
              </div>
            </div>

            <span className="stamp absolute -right-3 top-16 hidden rotate-[8deg] border-clay-300 bg-paper/90 text-clay-600 sm:inline-flex">
              {t.home.stampReview}
            </span>
          </div>
        </div>
      </section>

      {/* ── Registration window ──────────────────────────────── */}
      <div className="border-b border-line bg-paper">
        <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-2 py-3">
          <p className="meta text-[10px] text-forest-700">{t.home.windowLabel}</p>
          <p className="font-mono text-[11px] tabular text-ink">
            {formatDate(dvYear.opensAt, locale)} — {formatDate(dvYear.closesAt, locale)}
          </p>
          <span className={`stamp ${windowOpen ? "border-forest-300 text-forest-700" : "border-line-strong text-muted"}`}>
            {windowOpen ? t.home.windowOpen : t.home.windowClosed}
          </span>
          <p className="meta ml-auto hidden text-[10px] sm:block">{t.home.closesLabel} · {formatDate(dvYear.closesAt, locale)}</p>
        </div>
      </div>

      {/* ── Process ──────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-24 border-b border-line">
        <div className="container-page py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">{t.home.howEyebrow}</p>
              <h2 className="display mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)]">{t.home.howTitle}</h2>
              <p className="lede mt-4 max-w-sm text-[15px]">{t.home.howSub}</p>
              <Link href={`/${locale}/apply`} className="btn-secondary mt-7">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <ol className="border-t border-line">
              {steps.map((step, index) => (
                <li key={step.title} className="group border-b border-line">
                  <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 py-5 transition-colors sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6">
                    <span
                      className="font-serif text-[26px] leading-none tabular text-line-strong transition-colors group-hover:text-clay-300 sm:text-[30px]"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold leading-6 text-ink">{step.title}</h3>
                      <p className="mt-1 text-[13.5px] leading-6 text-muted">{step.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────── */}
      <section id="packages" className="scroll-mt-24 border-b border-line bg-paper">
        <div className="container-page py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow">{t.home.pricingEyebrow}</p>
              <h2 className="display mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)]">{t.home.pricingTitle}</h2>
              <p className="lede mt-4 text-[15px]">{t.home.pricingSub}</p>
            </div>

            <div className="w-full max-w-xs border border-line bg-ivory/50 p-4">
              <p className="eyebrow-muted text-[10px]">{t.home.priceHow}</p>
              <div className="mt-3 space-y-1.5">
                {[t.home.ruleMarital, t.home.ruleSpouse, t.home.ruleChildren].map((rule, index) => (
                  <p key={rule} className="flex items-baseline gap-2 font-mono text-[10.5px] leading-4 text-ink/70">
                    <span className="text-clay-500" aria-hidden="true">
                      {index === 2 ? "└" : "├"}
                    </span>
                    {rule}
                  </p>
                ))}
                <p className="flex items-baseline gap-2 border-t border-line pt-2 font-mono text-[10.5px] leading-4 text-forest-800">
                  <span aria-hidden="true">→</span>
                  {t.home.calculated}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 border border-line bg-ivory">
            <div className="hidden grid-cols-3 divide-x divide-line border-b border-line md:grid">
              {[t.home.colPackage, t.home.colFor, t.home.colPrice].map((heading) => (
                <p key={heading} className="px-6 py-2.5 font-mono text-2xs uppercase text-muted" style={{ letterSpacing: "0.16em" }}>
                  {heading}
                </p>
              ))}
            </div>

            <div className="divide-y divide-line">
              {packages.map((pkg) => (
                <div key={pkg.key} className="grid gap-5 p-6 transition-colors hover:bg-paper/60 md:grid-cols-3 md:items-center md:gap-0 md:p-0">
                  <div className="md:px-6 md:py-6">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-3xs text-clay-600" aria-hidden="true">
                        {pkg.key}
                      </span>
                      <h3 className="font-serif text-[23px] leading-none text-forest-900">{pkg.label}</h3>
                    </div>
                  </div>
                  <p className="text-[13px] leading-6 text-muted md:border-l md:border-line md:px-6 md:py-6">{pkg.desc}</p>
                  <div className="flex flex-wrap items-center justify-between gap-4 md:border-l md:border-line md:px-6 md:py-6">
                    <div>
                      <p className="font-serif text-[30px] leading-none tabular text-forest-900">
                        {formatCurrency(pkg.price, locale)}
                      </p>
                      <p className="mt-1.5 font-mono text-2xs uppercase text-muted" style={{ letterSpacing: "0.14em" }}>
                        {t.common.perApplication}
                      </p>
                    </div>
                    <Link
                      href={`/${locale}/apply`}
                      className="btn-secondary btn-sm"
                      aria-label={`${t.home.compareCta} — ${pkg.label}`}
                    >
                      {t.nav.apply}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-[12px] leading-6 text-muted">{t.home.pricingNote}</p>
        </div>
      </section>

      {/* ── Transparency ─────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="eyebrow">{t.home.transparencyEyebrow}</p>
            <h2 className="display mt-4 text-[clamp(1.75rem,3vw,2.35rem)]">{t.home.transparencyTitle}</h2>
          </div>
          <ul className="border-t border-line">
            {facts.map((fact) => (
              <li key={fact.title} className="flex items-start gap-4 border-b border-line py-5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-clay" aria-hidden="true" />
                <div>
                  <h3 className="text-[14.5px] font-semibold text-ink">
                    {fact.href ? (
                      <a
                        href={fact.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-clay-600"
                      >
                        {fact.title}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      fact.title
                    )}
                  </h3>
                  <p className="mt-1 text-[13px] leading-6 text-muted">{fact.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24 border-b border-line bg-paper">
        <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">{t.home.faqEyebrow}</p>
            <h2 className="display mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)]">{t.home.faqTitle}</h2>
            <Link href={`/${locale}/faq`} className="link mt-5 inline-flex items-center gap-1.5 text-sm">
              {t.home.faqLink}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="border-t border-line">
            {faqs.map((faq, index) => (
              <details key={faq.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start gap-4 py-4 marker:hidden">
                  <span className="mt-0.5 font-mono text-3xs text-clay-600" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[14.5px] font-medium leading-6 text-ink transition-colors group-hover:text-forest-800">
                    {faq.q}
                  </span>
                  <Plus
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mb-5 ml-9 max-w-xl text-[13px] leading-6 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────── */}
      <section className="bg-forest-950 text-paper">
        <div className="paper-grain">
          <div className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
            <div>
              <p className="eyebrow text-clay-200">{t.home.finalEyebrow}</p>
              <h2 className="display mt-4 text-[clamp(2rem,4vw,3.1rem)] text-paper">{t.home.finalTitle}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-paper/65">{t.home.finalBody}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={`/${locale}/apply`} className="btn-inverse">
                  {t.home.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="btn border border-white/25 text-paper hover:border-white/50 hover:bg-white/[0.06]"
                >
                  {t.home.contactCta}
                </Link>
              </div>
            </div>

            <dl className="divide-y divide-white/10 border-y border-white/10 self-center">
              {[
                { label: t.common.email, value: config.contact.email, href: `mailto:${config.contact.email}` },
                { label: t.common.phone, value: config.contact.phone, href: `tel:${config.contact.phone.replace(/\s+/g, "")}` },
                { label: t.nav.contact, value: config.contact.address },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="font-mono text-3xs uppercase text-paper/40" style={{ letterSpacing: "0.16em" }}>
                    {row.label}
                  </dt>
                  <dd className="max-w-[16rem] text-right text-[13px] leading-5 text-paper/85">
                    {row.href ? (
                      <a href={row.href} className="transition-colors hover:text-paper">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
