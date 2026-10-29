import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Info, Lock } from "lucide-react";
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
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-page py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/${locale}/account`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-forest-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t.account.title}
            </Link>
            <SignOutButton label={t.common.signOut} redirectTo={`/${locale}`} />
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">
                {application.ref} · DV {application.dvYear}
              </p>
              <h1 className="display mt-2.5 text-[clamp(1.7rem,3.4vw,2.4rem)]">
                {application.applicant.firstName} {application.applicant.lastName}
              </h1>
              <p className="mt-2 text-[12.5px] text-muted">
                {packageLabel} · {formatCurrency(application.amountCents, locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge kind="application" value={application.status} t={t} />
              <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          {payment === "paid" && (
            <div className="mb-6 flex items-start gap-2 border-l-2 border-forest-400 bg-forest-50 px-4 py-3 text-[13px] text-forest-800" role="status">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {tx("Pagesa u konfirmua. Faleminderit.", "Payment confirmed. Thank you.")}
            </div>
          )}
          {(payment === "pending" || payment === "unavailable") && (
            <div className="mb-6 flex items-start gap-2 border-l-2 border-warning bg-warning-50 px-4 py-3 text-[13px] text-warning" role="alert">
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
            <div className="mb-6 flex items-start gap-2 border-l-2 border-forest-300 bg-forest-50 px-4 py-3 text-[13px] text-forest-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t.account.editRequestSent}
            </div>
          )}
          {notice === "data" && (
            <div className="mb-6 flex items-start gap-2 border-l-2 border-forest-300 bg-forest-50 px-4 py-3 text-[13px] text-forest-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t.account.dataRequestBody}
            </div>
          )}
          {error === "edit_short" && (
            <p className="mb-6 border-l-2 border-danger bg-danger-50 px-4 py-3 text-[13px] text-danger" role="alert">
              {tx("Përshkruaj ndryshimin me të paktën 5 karaktere.", "Describe the change in at least 5 characters.")}
            </p>
          )}
          {error === "edit_closed" && (
            <p className="mb-6 border-l-2 border-warning bg-warning-50 px-4 py-3 text-[13px] text-warning" role="alert">
              {tx(
                "Ky aplikim është i mbyllur. Kontakto zyrën për ndryshime.",
                "This application is closed. Contact the office for changes.",
              )}
            </p>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
            <div className="min-w-0 space-y-6">
              {/* The single most important message on the page. */}
              <section
                id="application"
                className={`scroll-mt-24 border-l-2 bg-paper py-4 pl-5 pr-4 ${
                  next.needsClient ? "border-clay" : "border-forest-300"
                }`}
              >
                <p className="eyebrow-muted text-[10px]">{t.account.nextAction}</p>
                <h2 className="mt-1.5 font-serif text-[22px] leading-snug text-forest-900">{next.title}</h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-muted">{next.body}</p>
                {application.statusReason && application.status === "needs_information" && (
                  <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-5 text-ink/80">{application.statusReason}</p>
                )}
              </section>

              <section id="photos" className="scroll-mt-24 border border-line bg-paper p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="eyebrow-muted text-[10px]">{t.account.photos}</h2>
                  <p className="font-mono text-[10px] tabular text-muted">
                    {application.photos.filter((photo) => photo.status === "approved").length} / {application.photos.length}
                  </p>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-muted">{t.apply.photoAdvisory}</p>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {application.photos.map((photo) => (
                    <li key={photo.id} className="border border-line p-2">
                      <div className="aspect-square overflow-hidden bg-ivory">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/files/${photo.storageKey}`}
                          alt={`${t.apply.photoFor} ${photo.memberName}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-2 truncate text-[11.5px] font-medium text-ink">{photo.memberName}</p>
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
                  <p className="mt-3 border-l-2 border-line-strong bg-ivory px-3 py-2 text-[11px] leading-5 text-muted">
                    {t.account.photosLocked}
                  </p>
                )}
              </section>

              <section id="timeline" className="scroll-mt-24 border border-line bg-paper p-5">
                <h2 className="eyebrow-muted text-[10px]">{t.account.timeline}</h2>
                {activity.length === 0 ? (
                  <p className="mt-3 text-[12.5px] text-muted">{t.common.noResults}</p>
                ) : (
                  <ol className="mt-4">
                    {activity.slice(0, 12).map((item, index) => (
                      <li key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 pb-3">
                        <span className="relative flex w-3 justify-center">
                          <span className="mt-1.5 h-1.5 w-1.5 bg-forest-500" aria-hidden="true" />
                          {index < Math.min(activity.length, 12) - 1 && (
                            <span className="absolute top-3.5 h-full w-px bg-line" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 pb-1">
                          <span className="block text-[12.5px] leading-5 text-ink">{item.message}</span>
                          <span className="mt-0.5 block font-mono text-[10px] tabular text-muted">
                            {formatDateTime(item.createdAt, locale)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {!closed && (
                <section className="border border-line bg-paper p-5">
                  <h2 className="eyebrow-muted text-[10px]">{t.account.editRequest}</h2>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted">
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

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section id="payment" className="scroll-mt-24 border border-line bg-paper p-4">
                <h2 className="eyebrow-muted text-[10px]">{t.account.payment}</h2>
                {order ? (
                  <dl className="mt-3 divide-y divide-line border-t border-line text-[12px]">
                    <div className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="text-muted">{t.account.paymentReference}</dt>
                      <dd className="font-mono text-[11px] font-medium text-ink">{order.ref}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="text-muted">{t.common.amount}</dt>
                      <dd className="font-mono text-[11px] tabular text-ink">{formatCurrency(order.amountCents, locale)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="text-muted">{t.common.status}</dt>
                      <dd>
                        <StatusBadge kind="payment" value={order.status} t={t} />
                      </dd>
                    </div>
                    {order.expiresAt && order.status === "pending_cash" && (
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted">{t.complete.deadline}</dt>
                        <dd className="flex items-center gap-1 font-mono text-[11px] tabular text-ink">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDate(order.expiresAt, locale)}
                        </dd>
                      </div>
                    )}
                    {order.paidAt && (
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted">{t.status.paid}</dt>
                        <dd className="font-mono text-[11px] tabular text-ink">{formatDate(order.paidAt, locale)}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="mt-3 text-[12px] text-muted">{t.account.noPayment}</p>
                )}
                {cashInstructions && (
                  <p className="mt-3 border-l-2 border-line-strong bg-ivory px-3 py-2 text-[11px] leading-5 text-ink/80">
                    {cashInstructions}
                  </p>
                )}
              </section>

              <section id="confirmation" className="scroll-mt-24 border border-line bg-paper p-4">
                <h2 className="eyebrow-muted text-[10px]">{t.account.confirmation}</h2>
                {filing ? (
                  <div className="mt-3">
                    <p className="font-mono text-[13px] font-semibold tracking-wide text-forest-900">
                      {filing.confirmationNumber}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] tabular text-muted">
                      {tx("Dorëzuar", "Filed")}: {formatDate(filing.filedAt, locale)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-muted">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      {application.status === "ready_to_file" || application.status === "filed"
                        ? t.account.notFiledYet
                        : t.account.confirmationLocked}
                    </span>
                  </div>
                )}
              </section>

              <section className="border border-line bg-paper p-4">
                <h2 className="eyebrow-muted text-[10px]">{t.legal.contactTitle}</h2>
                <ul className="mt-2.5 space-y-1.5 text-[11.5px] leading-5 text-muted">
                  <li>{config.contact.address}</li>
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

              <section className="border border-line bg-paper p-4">
                <h2 className="eyebrow-muted text-[10px]">{t.account.requestData}</h2>
                <div className="mt-2.5">
                  <DataRequestForm locale={locale} t={t} applicationId={application.id} />
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
