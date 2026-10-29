import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DemoPortalLink } from "@/components/applications/demo-portal-link";
import { getApplication } from "@/lib/repo/applications";
import { decodeLastApplication, LAST_APP_COOKIE } from "@/lib/auth/last-application";
import { getOrderForApplication } from "@/lib/repo/orders";
import { getSettings, renderCashInstructions } from "@/lib/repo/settings";
import { latestNotificationFor } from "@/lib/notifications/service";
import { getPublicConfig } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aplikimi u dorëzua",
  robots: { index: false, follow: false },
};

export default async function ApplyCompletePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);

  const jar = await cookies();
  const applicationId = decodeLastApplication(jar.get(LAST_APP_COOKIE)?.value);
  const application = applicationId ? await getApplication(applicationId) : null;
  const config = getPublicConfig();

  if (!application) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg border border-line bg-paper p-8">
          <p className="eyebrow-muted text-[10px]">{t.complete.title}</p>
          <h1 className="display mt-3 text-[28px] leading-tight">{t.complete.title}</h1>
          <p className="mt-3 text-[13.5px] leading-6 text-muted">{t.complete.portalBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/login`} className="btn-primary">
              {t.complete.portalCta}
            </Link>
            <Link href={`/${locale}`} className="btn-secondary">
              {t.legal.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const order = await getOrderForApplication(application.id);
  const settings = await getSettings();
  const submissionEmail = await latestNotificationFor(application.id, "application_submitted");
  const emailMessage =
    submissionEmail?.status === "sent"
      ? t.complete.emailSent
      : submissionEmail?.status === "failed"
        ? t.complete.emailFailed
        : submissionEmail?.status === "queued"
          ? t.complete.emailQueued
          : t.complete.emailNotConfigured;
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const isCash = order?.method === "cash";
  const packageLabel =
    application.packageKey === "individual"
      ? t.common.pkgIndividual
      : application.packageKey === "couple"
        ? t.common.pkgCouple
        : t.common.pkgFamily;

  const cashInstructions = order
    ? renderCashInstructions(locale === "sq" ? settings.cashInstructionsSq : settings.cashInstructionsEn, {
        amount: formatCurrency(order.amountCents, locale),
        ref: order.ref,
        address: config.contact.address,
        phone: config.contact.phone,
        email: config.contact.email,
      })
    : null;

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-clay" aria-hidden="true" />
            <p className="eyebrow">{tx("Konfirmim dorëzimi", "Submission receipt")}</p>
          </div>
          <h1 className="display mt-5 text-[clamp(2rem,4.5vw,2.9rem)]">{t.complete.title}</h1>
          <p className="lede mt-4 max-w-xl text-[14.5px]">{t.complete.intro}</p>

          {/* Receipt document */}
          <div className="mt-9 border border-line-strong bg-paper">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="meta text-[10px] text-forest-700">
                GCK · DV {config.dv.year}
              </p>
              <span className="stamp inline-flex items-center gap-1.5 border-forest-300 text-forest-700">
                <Check className="h-3 w-3" aria-hidden="true" />
                {tx("Pranuar", "Received")}
              </span>
            </div>

            <div className="px-5 py-5">
              <p className="eyebrow-muted text-[10px]">{t.complete.reference}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="font-mono text-[26px] font-semibold leading-none tracking-tight text-forest-900">{application.ref}</p>
                <CopyButton
                  value={application.ref}
                  label={t.common.copy}
                  copiedLabel={t.complete.referenceCopied}
                  failedLabel={t.common.copyFailed}
                />
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-x-8 border-t border-line sm:grid-cols-2">
                {[
                  { label: t.complete.package, value: packageLabel },
                  { label: t.complete.amount, value: formatCurrency(application.amountCents, locale), mono: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line py-3 sm:block sm:border-b-0 sm:py-4">
                    <dt className="text-[12px] text-muted">{row.label}</dt>
                    <dd className={`text-[13.5px] text-ink sm:mt-1 ${row.mono ? "font-mono tabular" : "font-medium"}`}>{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 sm:block sm:border-b-0 sm:py-4">
                  <dt className="text-[12px] text-muted">{t.complete.paymentStatus}</dt>
                  <dd className="sm:mt-1.5">
                    <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 sm:block sm:border-b-0 sm:py-4">
                  <dt className="text-[12px] text-muted">{t.complete.deadline}</dt>
                  <dd className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink sm:mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    {formatDate(order?.expiresAt, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-line bg-ivory/50 px-5 py-4">
              <h2 className="text-[13px] font-semibold text-ink">
                {isCash ? t.complete.cashTitle : tx("Pagesa me kartë", "Card payment")}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-6 text-muted">
                {isCash
                  ? cashInstructions ?? t.complete.cashBody
                  : tx(
                      "Pagesa me kartë përpunohet nga ofruesi i pagesave. Statusi përditësohet vetëm pasi ofruesi konfirmon transaksionin. Nëse pagesa nuk filloi, hap portalin ose kontakto zyrën me referencën e porosisë.",
                      "Card payment is processed by the payment provider. The status updates only after the provider confirms the transaction. If payment did not start, open the portal or contact the office with the order reference.",
                    )}
              </p>
              {order && (
                <p className="mt-3 inline-flex items-center gap-2 border border-line bg-paper px-2.5 py-1.5 font-mono text-[11px] text-ink">
                  <span className="text-muted">{t.account.paymentReference}</span>
                  <strong className="font-semibold">{order.ref}</strong>
                </p>
              )}
              <ul className="mt-4 space-y-2 border-t border-line pt-3 text-[12px] text-muted">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {config.contact.address}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <a href={`tel:${config.contact.phone.replace(/\s/g, "")}`} className="link">
                    {config.contact.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <a href={`mailto:${config.contact.email}`} className="link">
                    {config.contact.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-muted">{t.home.footerDisclaimer}</p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line bg-paper p-5">
            <p className="eyebrow-muted text-[10px]">{t.complete.portalTitle}</p>
            <p className="mt-2.5 text-[12.5px] leading-6 text-muted">{t.complete.portalBody}</p>

            <p className="mt-4 border-l-2 border-line-strong pl-3 text-[11px] leading-5 text-muted">{emailMessage}</p>

            <Link href={`/${locale}/login`} className="btn-secondary btn-sm mt-4 w-full">
              {t.complete.portalCta}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}`}
              className="mt-2 block text-center font-mono text-[10px] uppercase text-muted transition-colors hover:text-forest-800"
              style={{ letterSpacing: "0.12em" }}
            >
              {t.legal.backHome}
            </Link>
          </div>

          {config.demo && (
            <div className="mt-4">
              <DemoPortalLink t={t} locale={locale} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
