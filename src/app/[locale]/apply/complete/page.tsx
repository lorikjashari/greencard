import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
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
        <div className="mx-auto max-w-lg rounded-lg border border-line bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-forest-200 bg-forest-50 text-forest">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-serif text-2xl text-forest-900">{t.complete.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t.complete.portalBody}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
    ? renderCashInstructions(
        locale === "sq" ? settings.cashInstructionsSq : settings.cashInstructionsEn,
        {
          amount: formatCurrency(order.amountCents, locale),
          ref: order.ref,
          address: config.contact.address,
          phone: config.contact.phone,
          email: config.contact.email,
        },
      )
    : null;

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-line bg-white p-6 shadow-card sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-serif text-3xl tracking-[-0.02em] text-forest-900">{t.complete.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t.complete.intro}</p>

          <div className="mt-7 rounded-md border border-forest-200 bg-forest-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-forest-700">
              {t.complete.reference}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <p className="font-mono text-xl font-semibold tracking-wide text-forest-900">{application.ref}</p>
              <CopyButton
                value={application.ref}
                label={t.common.copy}
                copiedLabel={t.complete.referenceCopied}
                failedLabel={t.common.copyFailed}
              />
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted">
                {t.complete.package}
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">{packageLabel}</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted">
                {t.complete.amount}
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {formatCurrency(application.amountCents, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted">
                {t.complete.paymentStatus}
              </dt>
              <dd className="mt-1">
                <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
              </dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold uppercase tracking-wide text-muted">
                {t.complete.deadline}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
                <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                {formatDate(order?.expiresAt, locale)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-[13px] font-semibold text-ink">
              {isCash ? t.complete.cashTitle : tx("Pagesa me kartë", "Card payment")}
            </h2>
            <p className="mt-2 text-[12.5px] leading-6 text-muted">
              {isCash
                ? cashInstructions ?? t.complete.cashBody
                : tx(
                    "Pagesa me kartë përpunohet nga ofruesi i pagesave. Statusi përditësohet vetëm pasi ofruesi konfirmon transaksionin. Nëse pagesa nuk filloi, hap portalin ose kontakto zyrën me referencën e porosisë.",
                    "Card payment is processed by the payment provider. The status updates only after the provider confirms the transaction. If payment did not start, open the portal or contact the office with the order reference.",
                  )}
            </p>
            {order && (
              <p className="mt-3 rounded-md bg-ivory px-3 py-2 font-mono text-xs text-ink">
                {t.account.paymentReference}: <strong>{order.ref}</strong>
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
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-[13px] font-semibold text-ink">{t.complete.portalTitle}</h2>
            <p className="mt-2 text-[12.5px] leading-6 text-muted">{t.complete.portalBody}</p>
            <p className="mt-3 rounded-md bg-ivory px-3 py-2 text-2xs leading-5 text-muted">
              {emailMessage}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href={`/${locale}/login`} className="btn-secondary btn-sm w-full">
                {t.complete.portalCta}
              </Link>
              <Link href={`/${locale}`} className="text-center text-2xs font-medium text-muted hover:text-forest">
                {t.legal.backHome}
              </Link>
            </div>
          </section>
        </div>

        {config.demo && (
          <div className="mt-6">
            <DemoPortalLink t={t} locale={locale} />
          </div>
        )}

        <p className="mt-8 text-center text-2xs leading-5 text-muted">{t.home.footerDisclaimer}</p>
      </div>
    </div>
  );
}
