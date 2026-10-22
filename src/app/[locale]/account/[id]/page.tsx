import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PortalPhotoUpload } from "@/components/applications/portal-photo-upload";
import { EditRequestForm } from "@/components/account/edit-request-form";
import { DataRequestForm } from "@/components/account/data-request-form";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { getApplication, listActivity } from "@/lib/repo/applications";
import { getOrderForApplication } from "@/lib/repo/orders";
import { getFilingForApplication } from "@/lib/repo/filings";
import { getSettings, renderCashInstructions } from "@/lib/repo/settings";
import { getPublicConfig } from "@/lib/config";
import { ensureDemoSeed } from "@/lib/demo/seed";
import { nextActionFor } from "@/lib/client/next-action";
import { photoUploadLocked } from "@/lib/dv/photo-rules";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aplikimi",
  robots: { index: false, follow: false },
};

export default async function AccountApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ notice?: string; error?: string; payment?: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { notice, error, payment } = await searchParams;
  const t = copy(locale);

  if (getPublicConfig().demo) await ensureDemoSeed();
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  if (isStaffRole(session.role)) redirect(`/admin/applications/${id}`);

  const application = await getApplication(id);
  if (!application || application.ownerEmail !== session.email) notFound();

  const [order, filing, activity, settings] = await Promise.all([
    getOrderForApplication(application.id),
    getFilingForApplication(application.id),
    listActivity(application.id, "client"),
    getSettings(),
  ]);
  const config = getPublicConfig();
  const next = nextActionFor(application, order, locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);

  const packageLabel =
    application.packageKey === "individual"
      ? t.common.pkgIndividual
      : application.packageKey === "couple"
        ? t.common.pkgCouple
        : t.common.pkgFamily;

  const cashInstructions =
    order && order.status === "pending_cash"
      ? renderCashInstructions(locale === "sq" ? settings.cashInstructionsSq : settings.cashInstructionsEn, {
          amount: formatCurrency(order.amountCents, locale),
          ref: order.ref,
          address: config.contact.address,
          phone: config.contact.phone,
          email: config.contact.email,
        })
      : null;

  const closed = ["cancelled", "rejected", "expired"].includes(application.status);
  const photosFrozen = photoUploadLocked(application.status);

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/account`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-forest"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.account.title}
          </Link>
          <SignOutButton label={t.common.signOut} redirectTo={`/${locale}`} />
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {application.ref}
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-[-0.02em] text-forest-900">
              {application.applicant.firstName} {application.applicant.lastName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {packageLabel} · {formatCurrency(application.amountCents, locale)} · DV {application.dvYear}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="application" value={application.status} t={t} />
            <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
          </div>
        </div>

        {payment === "paid" && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-[13px] text-emerald-900" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {tx("Pagesa u konfirmua. Faleminderit.", "Payment confirmed. Thank you.")}
          </div>
        )}
        {(payment === "pending" || payment === "unavailable") && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-900" role="alert">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {payment === "unavailable"
              ? tx(
                  "Pagesa me kartë nuk është e disponueshme në këtë moment. Asnjë pagesë nuk u krye.",
                  "Card payment is not available right now. No payment was taken.",
                )
              : tx(
                  "Pagesa nuk është konfirmuar ende. Nëse ke paguar, prit konfirmimin ose kontakto zyrën me referencën e porosisë.",
                  "Payment is not confirmed yet. If you paid, wait for confirmation or contact the office with the order reference.",
                )}
          </div>
        )}

        {notice === "edit" && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-forest-200 bg-forest-50 p-3.5 text-[13px] text-forest-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.account.editRequestSent}
          </div>
        )}
        {notice === "data" && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-forest-200 bg-forest-50 p-3.5 text-[13px] text-forest-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.account.dataRequestBody}
          </div>
        )}
        {error === "edit_short" && (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-900" role="alert">
            {tx("Përshkruaj ndryshimin me të paktën 5 karaktere.", "Describe the change in at least 5 characters.")}
          </p>
        )}
        {error === "edit_closed" && (
          <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-900" role="alert">
            {tx(
              "Ky aplikim është i mbyllur. Kontakto zyrën për ndryshime.",
              "This application is closed. Contact the office for changes.",
            )}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section
              id="application"
              className={`scroll-mt-24 rounded-lg border p-5 ${
                next.needsClient ? "border-amber-300 bg-amber-50/60" : "border-line bg-white"
              }`}
            >
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">
                {t.account.nextAction}
              </p>
              <h2 className="mt-1.5 text-[15px] font-semibold text-ink">{next.title}</h2>
              <p className="mt-1 text-[13px] leading-6 text-ink/75">{next.body}</p>
              {application.statusReason && application.status === "needs_information" && (
                <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-[12.5px] leading-5 text-ink/80">
                  {application.statusReason}
                </p>
              )}
            </section>

            <section id="photos" className="scroll-mt-24 rounded-lg border border-line bg-white p-5">
              <h2 className="text-[13px] font-semibold text-ink">{t.account.photos}</h2>
              <p className="mt-1 text-2xs leading-5 text-muted">{t.apply.photoAdvisory}</p>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {application.photos.map((photo) => (
                  <li key={photo.id} className="rounded-md border border-line p-2">
                    <div className="aspect-square overflow-hidden rounded bg-ivory">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/files/${photo.storageKey}`}
                        alt={`${t.apply.photoFor} ${photo.memberName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 truncate text-2xs font-medium text-ink">{photo.memberName}</p>
                    <div className="mt-1">
                      <StatusBadge kind="photo" value={photo.status} t={t} />
                    </div>
                    {photo.status !== "approved" && !photosFrozen && (
                      <PortalPhotoUpload
                        applicationId={application.id}
                        memberKey={photo.memberKey}
                        memberName={photo.memberName}
                        locale={locale}
                      />
                    )}
                  </li>
                ))}
              </ul>
              {photosFrozen && (
                <p className="mt-3 rounded-md border border-line bg-ivory px-3 py-2 text-2xs leading-5 text-muted">
                  {t.account.photosLocked}
                </p>
              )}
            </section>

            <section id="timeline" className="scroll-mt-24 rounded-lg border border-line bg-white p-5">
              <h2 className="text-[13px] font-semibold text-ink">{t.account.timeline}</h2>
              {activity.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-muted">{t.common.noResults}</p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {activity.slice(0, 12).map((item) => (
                    <li key={item.id} className="relative border-l border-line pl-4">
                      <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-forest" />
                      <p className="text-[12.5px] leading-5 text-ink">{item.message}</p>
                      <p className="mt-0.5 text-2xs text-muted">{formatDateTime(item.createdAt, locale)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {!closed && (
              <section className="rounded-lg border border-line bg-white p-5">
                <h2 className="text-[13px] font-semibold text-ink">{t.account.editRequest}</h2>
                <p className="mt-1 text-2xs leading-5 text-muted">
                  {tx(
                    "Ndryshimet nuk bëhen automatikisht. Stafi i shqyrton dhe të kontakton.",
                    "Changes are not applied automatically. Staff review the request and contact you.",
                  )}
                </p>
                <div className="mt-3">
                  <EditRequestForm locale={locale} t={t} applicationId={application.id} />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section id="payment" className="scroll-mt-24 rounded-lg border border-line bg-white p-4">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                {t.account.payment}
              </h2>
              {order ? (
                <div className="mt-3 space-y-2 text-[12.5px] leading-5">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t.account.paymentReference}</span>
                    <span className="font-mono text-xs font-semibold text-ink">{order.ref}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t.common.amount}</span>
                    <span className="font-medium text-ink">{formatCurrency(order.amountCents, locale)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t.common.status}</span>
                    <StatusBadge kind="payment" value={order.status} t={t} />
                  </div>
                  {order.expiresAt && order.status === "pending_cash" && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">{t.complete.deadline}</span>
                      <span className="flex items-center gap-1 text-ink">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatDate(order.expiresAt, locale)}
                      </span>
                    </div>
                  )}
                  {order.paidAt && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">{t.status.paid}</span>
                      <span className="text-ink">{formatDate(order.paidAt, locale)}</span>
                    </div>
                  )}
                  {cashInstructions && (
                    <div className="mt-2 rounded-md bg-ivory px-3 py-2.5 text-2xs leading-5 text-ink/80">
                      {cashInstructions}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] text-muted">{t.account.noPayment}</p>
              )}
            </section>

            <section id="confirmation" className="scroll-mt-24 rounded-lg border border-line bg-white p-4">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t.account.confirmation}
              </h2>
              {filing ? (
                <div className="mt-3">
                  <p className="text-2xs text-muted">{t.account.confirmationNumber}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-forest-900">
                    {filing.confirmationNumber}
                  </p>
                  <p className="mt-1.5 text-2xs text-muted">
                    {tx("Dorëzuar", "Filed")}: {formatDate(filing.filedAt, locale)}
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2 text-2xs leading-5 text-muted">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {application.status === "ready_to_file" || application.status === "filed"
                      ? t.account.notFiledYet
                      : t.account.confirmationLocked}
                  </span>
                </div>
              )}
            </section>

            <section id="documents" className="scroll-mt-24 rounded-lg border border-line bg-white p-4">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t.account.documents}
              </h2>
              <p className="mt-2 text-2xs leading-5 text-muted">{t.account.documentsSoon}</p>
            </section>

            <section className="rounded-lg border border-line bg-white p-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                {t.legal.contactTitle}
              </h2>
              <ul className="mt-2 space-y-2 text-2xs text-muted">
                <li className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  {config.contact.address}
                </li>
                <li>
                  <a href={`mailto:${config.contact.email}`} className="link">
                    {config.contact.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${config.contact.phone.replace(/\s/g, "")}`} className="link">
                    {config.contact.phone}
                  </a>
                </li>
              </ul>
            </section>

            <section className="rounded-lg border border-line bg-white p-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                {t.account.requestData}
              </h2>
              <div className="mt-2">
                <DataRequestForm locale={locale} t={t} applicationId={application.id} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
