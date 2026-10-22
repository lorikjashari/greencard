import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { hasPermission, nextApplicationStatuses, canRoleTransition } from "@/lib/status/transitions";
import {
  getApplication,
  listActivity,
} from "@/lib/repo/applications";
import { getOrderForApplication } from "@/lib/repo/orders";
import { getFilingForApplication } from "@/lib/repo/filings";
import { listEditRequests } from "@/lib/repo/requests";
import { listUsers } from "@/lib/repo/users";
import { countryName } from "@/lib/countries";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNotice, AdminPageHeader, AdminEmpty, SectionCard } from "@/components/admin/ui";
import {
  addNoteAction,
  assignAction,
  changeStatusAction,
  recordCashAction,
  recordFilingAction,
  refundAction,
  resolveEditRequestAction,
  reviewPhotoAction,
  sendConfirmationAction,
} from "@/app/admin/actions";
import type { ConsentRecord, PersonData } from "@/lib/types";

export const metadata: Metadata = { title: "Application" };
export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${(user ?? "").slice(0, 2)}***@${domain ?? "***"}`;
}

function maskPhone(phone: string): string {
  return `••• ${phone.slice(-3)}`;
}

function maskDob(date: string): string {
  return date ? `${date.slice(0, 4)}-••-••` : "—";
}

const consentLabels = (t: ReturnType<typeof copy>): Record<ConsentRecord["type"], string> => ({
  terms: t.apply.consentTerms,
  privacy: t.apply.consentPrivacy,
  immediate_performance: t.apply.consentImmediate,
  accuracy: t.apply.consentAccuracy,
  independent_service: t.apply.consentIndependent,
  guardian: t.apply.consentGuardian,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-5 text-ink">{empty ? "—" : value}</dd>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const staff = await requireAdminPage("applications.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { id } = await params;
  const { notice, error } = await searchParams;

  const application = await getApplication(id);
  if (!application) notFound();

  const [order, filing, activity, editRequests, users] = await Promise.all([
    getOrderForApplication(application.id),
    getFilingForApplication(application.id),
    listActivity(application.id),
    listEditRequests(application.id),
    listUsers(),
  ]);

  const sensitive = hasPermission(staff.role, "applications.view_sensitive");
  const canTransition = hasPermission(staff.role, "applications.transition");
  const canAssign = hasPermission(staff.role, "applications.assign");
  const canReviewPhotos = hasPermission(staff.role, "photos.review");
  const canViewPayments = hasPermission(staff.role, "payments.view");
  const canReconcile = hasPermission(staff.role, "payments.reconcile");
  const canRefund = hasPermission(staff.role, "payments.refund");
  const canFile = hasPermission(staff.role, "filing.file");
  const canNote = sensitive && (staff.role === "admin" || staff.role === "operator");

  const staffUsers = users.filter((user) => user.active && user.role !== "client");
  const assignee = application.assigneeId ? users.find((user) => user.id === application.assigneeId) : null;
  const visibleActivity = sensitive ? activity : activity.filter((item) => item.visibility === "client");

  const nextStatuses = canTransition
    ? nextApplicationStatuses(application.status).filter(
        (status) =>
          status !== "filed" &&
          status !== "confirmation_sent" &&
          canRoleTransition(staff.role, application.status, status),
      )
    : [];

  const packageLabel =
    application.packageKey === "individual"
      ? t.common.pkgIndividual
      : application.packageKey === "couple"
        ? t.common.pkgCouple
        : t.common.pkgFamily;

  const personRows = (person: PersonData, title: string) => (
    <div className="rounded-md border border-line p-3">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <dl className="mt-2 grid gap-2.5 sm:grid-cols-2">
        <Info label={t.apply.firstName} value={person.firstName} />
        <Info label={t.apply.lastName} value={person.lastName} />
        <Info label={t.apply.middleName} value={person.middleName} />
        <Info label={t.apply.dob} value={sensitive ? person.dateOfBirth : maskDob(person.dateOfBirth)} />
        <Info label={t.apply.gender} value={person.gender === "male" ? t.apply.male : person.gender === "female" ? t.apply.female : "—"} />
        <Info label={t.apply.birthCity} value={person.birthCity} />
        <Info label={t.apply.birthCountry} value={countryName(person.birthCountry, locale)} />
        <Info
          label={t.apply.eligibilityCountry}
          value={person.eligibilityCountry ? countryName(person.eligibilityCountry, locale) : "—"}
        />
        <Info
          label={t.apply.nationality}
          value={person.nationality ? countryName(person.nationality, locale) : "—"}
        />
        <Info
          label={t.apply.education}
          value={
            person.education
              ? person.education === "none"
                ? t.apply.educationNone
                : person.education === "high_school"
                  ? t.apply.educationHighSchool
                  : person.education === "university"
                    ? t.apply.educationUniversity
                    : person.education === "masters"
                      ? t.apply.educationMasters
                      : t.apply.educationDoctorate
              : "—"
          }
        />
      </dl>
    </div>
  );

  const assignedName = assignee?.name ?? "—";
  const latestNote = activity.find((item) => item.type === "note");

  return (
    <div>
      <AdminPageHeader
        title={`${application.ref} · ${application.applicant.firstName} ${application.applicant.lastName}`}
        description={`${packageLabel} · ${formatCurrency(application.amountCents, locale)} · DV ${application.dvYear}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canFile && (
              <Link href={`/admin/filing/${application.id}`} className="btn-primary btn-sm">
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                {tx("Hapësira e dorëzimit", "Filing workspace")}
              </Link>
            )}
            <Link href="/admin/applications" className="btn-secondary btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t.admin.nav.applications}
            </Link>
          </div>
        }
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge kind="application" value={application.status} t={t} />
        <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
        <span className="chip border-line bg-white text-muted">
          {tx("Caktuar", "Assignee")}: {assignedName}
        </span>
        {application.duplicate.level !== "none" && (
          <span className="chip border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {tx("Duplikat i mundshëm", "Possible duplicate")}
          </span>
        )}
        {!application.completeness.dataComplete && (
          <span className="chip border-amber-200 bg-amber-50 text-amber-800">
            {tx("Të dhëna që mungojnë", "Missing data")}: {application.completeness.missing.length}
          </span>
        )}
        {!sensitive && (
          <span className="chip border-line bg-ivory text-muted">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {tx("Të dhëna të ndjeshme të fshehura", "Sensitive fields hidden")}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <SectionCard
            title={tx("Veprime dhe statusi", "Status and actions")}
            description={tx(
              "Tranzicionet kontrollohen nga makina e gjendjeve dhe roli yt.",
              "Transitions are checked by the state machine and your role.",
            )}
          >
            {canTransition ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <form action={changeStatusAction} className="space-y-2">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                  <label className="label" htmlFor="status">
                    {tx("Ndrysho statusin", "Change status")}
                  </label>
                  <select id="status" name="status" className="field" required disabled={nextStatuses.length === 0}>
                    {nextStatuses.length === 0 ? (
                      <option value="">{tx("Nuk ka tranzicion të lejuar", "No allowed transition")}</option>
                    ) : (
                      nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {t.status[status]}
                        </option>
                      ))
                    )}
                  </select>
                  <label className="label" htmlFor="reason">
                    {tx("Arsye / shënim për klientin", "Reason / client note")}
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={2}
                    maxLength={1000}
                    className="field"
                    placeholder={tx("E detyrueshme për kërkesë informacioni", "Required when requesting information")}
                  />
                  <button type="submit" className="btn-primary btn-sm" disabled={nextStatuses.length === 0}>
                    {t.common.save}
                  </button>
                  <p className="text-2xs leading-5 text-muted">
                    {tx(
                      "Dorëzimi dhe njoftimi i konfirmimit regjistrohen vetëm në Qendrën e dorëzimit.",
                      "Filing and confirmation notices are recorded only in the Filing centre.",
                    )}
                  </p>
                </form>

                {canAssign ? (
                  <form action={assignAction} className="space-y-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                    <label className="label" htmlFor="assigneeId">
                      {tx("Cakto stafin", "Assign staff")}
                    </label>
                    <select id="assigneeId" name="assigneeId" className="field" defaultValue={application.assigneeId ?? ""}>
                      <option value="">{tx("Pa caktim", "Unassigned")}</option>
                      {staffUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} · {user.role}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-secondary btn-sm">
                      {t.common.save}
                    </button>
                  </form>
                ) : (
                  <div className="text-[12.5px] text-muted">
                    {tx("Vetëm administratori dhe operatori mund të caktojnë raste.", "Only admins and operators can assign cases.")}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12.5px] leading-6 text-muted">
                {tx(
                  "Roli yt është vetëm-lexim për statusin. Ndryshimet bëhen nga stafi operativ.",
                  "Your role is read-only for status. Changes are made by operational staff.",
                )}
              </p>
            )}
          </SectionCard>

          <SectionCard title={tx("Të dhënat e aplikimit", "Application data")}>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label={t.apply.maritalLabel} value={application.household.maritalStatus ? t.apply[`marital${application.household.maritalStatus.charAt(0).toUpperCase()}${application.household.maritalStatus.slice(1)}` as keyof typeof t.apply] : "—"} />
              <Info label={t.apply.spouseIncludedLabel} value={application.household.spouseIncluded ? t.common.yes : t.common.no} />
              <Info label={t.apply.childrenDeclared} value={application.household.declaredChildren} />
              <Info label={t.apply.childrenTitle} value={application.children.length} />
            </dl>
            {application.household.spouseExclusionReason && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-2xs leading-5 text-amber-900">
                {tx("Arsyeja e përjashtimit të bashkëshortit", "Spouse exclusion reason")}:{" "}
                {application.household.spouseExclusionReason}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {personRows(application.applicant, t.apply.applicantTitle ?? t.apply.step2)}
              {application.spouse && personRows(application.spouse, t.apply.spouseTitle ?? t.apply.step3)}
              {application.children.map((child, index) => (
                <div key={child.id}>
                  {personRows(child, `${t.apply.child} ${index + 1}`)}
                  <p className="mt-1 text-2xs text-muted">
                    {t.apply.childMarried}: {child.married ? t.common.yes : t.common.no} · {t.apply.childLivesWith}:{" "}
                    {child.livesWithApplicant ? t.common.yes : t.common.no} · {t.apply.childStepchild}:{" "}
                    {child.isStepchild ? t.common.yes : t.common.no}
                  </p>
                </div>
              ))}
              {application.children.length === 0 && (
                <p className="text-2xs text-muted">{t.apply.reviewNoChildren}</p>
              )}
            </div>

            <div className="mt-4 rounded-md border border-line p-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{t.apply.step5}</p>
              <dl className="mt-2 grid gap-2.5 sm:grid-cols-2">
                <Info label={t.common.email} value={sensitive ? application.contact.email : maskEmail(application.contact.email)} />
                <Info label={t.common.phone} value={sensitive ? application.contact.phone : maskPhone(application.contact.phone)} />
                <Info
                  label={t.apply.address1}
                  value={
                    sensitive
                      ? `${application.contact.addressLine1}${application.contact.addressLine2 ? `, ${application.contact.addressLine2}` : ""}`
                      : "••••"
                  }
                />
                <Info label={t.apply.city} value={sensitive ? application.contact.city : "••••"} />
                <Info label={t.apply.postalCode} value={application.contact.postalCode || "—"} />
                <Info label={t.apply.country} value={countryName(application.contact.country, locale)} />
                <Info label={t.apply.preferredLanguage} value={application.contact.preferredLocale.toUpperCase()} />
                <Info label={tx("Gjuha e aplikimit", "Application language")} value={application.locale.toUpperCase()} />
              </dl>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-line p-3">
                <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{t.apply.consentTitle}</p>
                <ul className="mt-2 space-y-1.5">
                  {application.consents.map((consent) => (
                    <li key={`${consent.type}-${consent.memberId ?? ""}`} className="flex items-start gap-1.5 text-2xs leading-5 text-ink/80">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-forest" aria-hidden="true" />
                      <span>
                        {consentLabels(t)[consent.type]} <span className="text-muted">· {formatDateTime(consent.acceptedAt, locale)}</span>
                      </span>
                    </li>
                  ))}
                  {application.consents.length === 0 && <li className="text-2xs text-muted">{t.common.none}</li>}
                </ul>
              </div>

              <div className="rounded-md border border-line p-3">
                <p className="text-2xs font-semibold uppercase tracking-wide text-muted">
                  {tx("Kontrolli i plotësisë", "Completeness")}
                </p>
                <ul className="mt-2 space-y-1.5 text-2xs leading-5">
                  <li className="flex items-center gap-1.5">
                    {application.completeness.dataComplete ? (
                      <CheckCircle2 className="h-3 w-3 text-forest" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    )}
                    {tx("Të dhënat e formularit", "Form data")}: {application.completeness.dataComplete ? tx("të plota", "complete") : tx("mungojnë", "missing")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    {application.completeness.photosApproved ? (
                      <CheckCircle2 className="h-3 w-3 text-forest" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    )}
                    {tx("Fotot e aprovuara", "Approved photos")}: {application.completeness.photosApproved ? t.common.yes : t.common.no}
                  </li>
                </ul>
                {sensitive && application.completeness.missing.length > 0 && (
                  <p className="mt-2 break-words text-2xs text-muted">{application.completeness.missing.join(", ")}</p>
                )}
                <p className="mt-2 text-2xs text-muted">
                  {tx("Duplikat", "Duplicate")}: {application.duplicate.level}
                  {application.duplicate.matches.length > 0 ? ` (${application.duplicate.matches.join(", ")})` : ""}
                </p>
              </div>
            </div>
          </SectionCard>

          {canReviewPhotos && (
            <SectionCard
              title={`${t.apply.step6} · ${application.photos.length}`}
              description={t.apply.photoAdvisory}
            >
              {application.photos.length === 0 ? (
                <AdminEmpty text={tx("Nuk ka foto të ngarkuara.", "No photos uploaded.")} />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {application.photos.map((photo) => (
                    <li key={photo.id} className="rounded-md border border-line p-3">
                      <div className="aspect-square overflow-hidden rounded bg-ivory">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/files/${photo.storageKey}`}
                          alt={`${photo.memberName} — ${application.ref}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-2xs font-semibold text-ink">{photo.memberName}</p>
                          <p className="text-2xs text-muted">
                            {photo.width}×{photo.height} · {Math.round(photo.bytes / 1024)} KB
                          </p>
                        </div>
                        <StatusBadge kind="photo" value={photo.status} t={t} />
                      </div>
                      {photo.issues.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {photo.issues.map((issue) => (
                            <li
                              key={issue.code}
                              className={`text-2xs leading-4 ${issue.severity === "error" ? "text-red-700" : "text-amber-700"}`}
                            >
                              {locale === "sq" ? issue.messageSq : issue.messageEn}
                            </li>
                          ))}
                        </ul>
                      )}
                      {photo.reviewedAt && (
                        <p className="mt-1 text-2xs text-muted">
                          {photo.reviewedBy} · {formatDateTime(photo.reviewedAt, locale)}
                          {photo.reviewNote ? ` · ${photo.reviewNote}` : ""}
                        </p>
                      )}
                      <form action={reviewPhotoAction} className="mt-2 space-y-1.5">
                        <input type="hidden" name="applicationId" value={application.id} />
                        <input type="hidden" name="photoId" value={photo.id} />
                        <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                        <input
                          name="note"
                          className="field px-2 py-1 text-2xs"
                          maxLength={500}
                          placeholder={tx("Shënim (i detyrueshëm për refuzim)", "Note (required for rejection)")}
                          aria-label={tx("Shënim për foton", "Photo note")}
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="submit"
                            name="decision"
                            value="approve"
                            className="btn-primary btn-sm flex-1"
                            disabled={photo.status === "approved"}
                          >
                            {t.apply.photoApproved}
                          </button>
                          <button
                            type="submit"
                            name="decision"
                            value="reject"
                            className="btn-secondary btn-sm flex-1"
                            disabled={photo.status === "rejected"}
                          >
                            {t.apply.photoRejected}
                          </button>
                        </div>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          <SectionCard title={t.account.timeline} description={tx("Të gjitha veprimet, përfshirë shënimet e brendshme.", "All activity, including internal notes.")}>
            {visibleActivity.length === 0 ? (
              <AdminEmpty text={tx("Nuk ka aktivitet.", "No activity.")} />
            ) : (
              <ol className="space-y-4">
                {visibleActivity.map((item) => (
                  <li key={item.id} className="relative border-l border-line pl-4">
                    <span
                      className={`absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full ${
                        item.visibility === "client" ? "bg-forest" : "bg-amber-500"
                      }`}
                    />
                    <p className="text-[12.5px] leading-5 text-ink">{item.message}</p>
                    <p className="mt-0.5 text-2xs text-muted">
                      {item.actorName} · {formatDateTime(item.createdAt, locale)} · {item.visibility}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {canNote && (
            <SectionCard title={tx("Shënime dhe mesazhe", "Notes and messages")}>
              <form action={addNoteAction} className="space-y-2">
                <input type="hidden" name="applicationId" value={application.id} />
                <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                <label className="label" htmlFor="message">
                  {tx("Shënim", "Note")}
                </label>
                <textarea id="message" name="message" rows={3} maxLength={2000} className="field" required minLength={3} />
                <label className="label" htmlFor="visibility">
                  {tx("Dukshmëria", "Visibility")}
                </label>
                <select id="visibility" name="visibility" className="field" defaultValue="internal">
                  <option value="internal">{tx("Vetëm staf (i brendshëm)", "Staff only (internal)")}</option>
                  <option value="client">{tx("I dukshëm për klientin", "Visible to the client")}</option>
                </select>
                <button type="submit" className="btn-secondary btn-sm">
                  {tx("Shto", "Add")}
                </button>
              </form>
              {latestNote && (
                <p className="mt-3 border-t border-line pt-2 text-2xs text-muted">
                  {tx("Shënimi i fundit", "Latest note")}: {latestNote.message}
                </p>
              )}
            </SectionCard>
          )}
        </div>

        <aside className="space-y-5">
          <SectionCard
            title={t.account.payment}
            action={
              canViewPayments ? (
                <Link href={`/admin/payments?q=${application.ref}`} className="text-2xs font-semibold text-forest">
                  {t.admin.nav.payments}
                </Link>
              ) : null
            }
          >
            {!canViewPayments ? (
              <p className="text-2xs text-muted">{tx("Nuk ke leje për të dhënat e pagesës.", "You do not have payment permission.")}</p>
            ) : order ? (
              <div className="space-y-2 text-[12.5px] leading-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">{t.account.paymentReference}</span>
                  <span className="font-mono text-xs font-semibold text-ink">{order.ref}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">{t.common.amount}</span>
                  <span className="font-medium text-ink">{formatCurrency(order.amountCents, locale)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">{t.common.status}</span>
                  <StatusBadge kind="payment" value={order.status} t={t} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">{tx("Metoda", "Method")}</span>
                  <span className="text-ink">{order.method}</span>
                </div>
                {order.receivedAmountCents != null && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">{tx("Arkëtuar", "Received")}</span>
                    <span className="text-ink">
                      {formatCurrency(order.receivedAmountCents, locale)} · {formatDate(order.receivedAt, locale)}
                    </span>
                  </div>
                )}
                {order.amountMismatch && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-2xs text-amber-900">
                    {tx("Mospërputhje shume", "Amount mismatch")}: {order.evidenceNote}
                    {order.mismatchReviewedAt ? (
                      <span className="mt-1 block font-medium text-emerald-800">
                        {tx("U shqyrtua", "Reviewed")}: {order.mismatchReviewNote} ·{" "}
                        {formatDate(order.mismatchReviewedAt, locale)}
                      </span>
                    ) : (
                      <span className="mt-1 block font-medium">
                        {tx("Shqyrtoje në rakordim para dorëzimit.", "Review it in reconciliation before filing.")}
                      </span>
                    )}
                  </p>
                )}
                {order.status === "pending_cash" && order.expiresAt && (
                  <p className="flex items-center gap-1 text-2xs text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {t.complete.deadline}: {formatDate(order.expiresAt, locale)}
                  </p>
                )}

                {canReconcile && order.status === "pending_cash" && (
                  <form action={recordCashAction} className="mt-3 space-y-2 border-t border-line pt-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                    <p className="text-2xs font-semibold uppercase tracking-wide text-muted">
                      {tx("Regjistro arkëtimin", "Record receipt")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label" htmlFor="amount">
                          {t.common.amount}
                        </label>
                        <input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          defaultValue={(order.amountCents / 100).toFixed(2)}
                          className="field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="receivedAt">
                          {tx("Data", "Date")}
                        </label>
                        <input id="receivedAt" name="receivedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="field" required />
                      </div>
                    </div>
                    <div>
                      <label className="label" htmlFor="receivingMethod">
                        {tx("Mënyra", "Receipt method")}
                      </label>
                      <select id="receivingMethod" name="receivingMethod" className="field" defaultValue="office">
                        <option value="office">{tx("Në zyrë", "At the office")}</option>
                        <option value="post">{tx("Me postë", "By post")}</option>
                        <option value="bank">{tx("Në bankë", "Bank transfer")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="paymentNote">
                        {t.common.notes}
                      </label>
                      <input id="paymentNote" name="note" className="field" maxLength={500} />
                    </div>
                    <button type="submit" className="btn-primary btn-sm w-full">
                      {tx("Konfirmo pagesën", "Confirm payment")}
                    </button>
                  </form>
                )}

                {canRefund && order.status === "paid" && order.method === "cash" && (
                  <form action={refundAction} className="mt-3 space-y-2 border-t border-line pt-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                    <label className="label" htmlFor="refundReason">
                      {tx("Arsyeja e rimbursimit", "Refund reason")}
                    </label>
                    <input id="refundReason" name="reason" className="field" minLength={5} required />
                    <button type="submit" className="btn-secondary btn-sm w-full">
                      {tx("Regjistro rimbursim", "Record refund")}
                    </button>
                  </form>
                )}
                {canRefund && order.status === "paid" && order.method === "card" && (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-2xs leading-5 text-amber-900">
                    {tx(
                      "Rimbursimet me kartë nuk procesohen nga ky ekran. Përdor panelin e ofruesit të pagesave dhe rakordoje manualisht.",
                      "Card refunds are not processed from this screen. Use the payment provider dashboard and reconcile manually.",
                    )}
                  </p>
                )}
              </div>
            ) : (
              <AdminEmpty text={tx("Nuk ka porosi.", "No order.")} />
            )}
          </SectionCard>

          <SectionCard title={t.account.confirmation}>
            {!canFile ? (
              <p className="text-2xs text-muted">{tx("Vetëm stafi i dorëzimit shikon këtë seksion.", "Only filing staff see this section.")}</p>
            ) : filing ? (
              <div className="space-y-2 text-[12.5px]">
                <p className="text-2xs text-muted">{t.account.confirmationNumber}</p>
                <p className="font-mono text-sm font-semibold text-forest-900">{filing.confirmationNumber}</p>
                <p className="text-2xs text-muted">
                  {formatDateTime(filing.filedAt, locale)} · {filing.filedBy}
                </p>
                {filing.notes && <p className="rounded-md bg-ivory px-2 py-1.5 text-2xs text-ink/80">{filing.notes}</p>}
                {application.status !== "confirmation_sent" && (
                  <form action={sendConfirmationAction} className="border-t border-line pt-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                    <button type="submit" className="btn-secondary btn-sm w-full">
                      {tx("Dërgo njoftimin e konfirmimit", "Send confirmation notice")}
                    </button>
                    <p className="mt-1 text-2xs text-muted">
                      {tx(
                        "Pa email të konfiguruar, njoftimi shkon vetëm në outbox dhe statusi nuk shënohet i dërguar.",
                        "Without email configured, the notice only goes to the outbox and status is not marked as sent.",
                      )}
                    </p>
                  </form>
                )}
              </div>
            ) : application.status === "ready_to_file" ? (
              <form action={recordFilingAction} className="space-y-2">
                <input type="hidden" name="applicationId" value={application.id} />
                <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                <label className="label" htmlFor="confirmationNumber">
                  {t.account.confirmationNumber}
                </label>
                <input
                  id="confirmationNumber"
                  name="confirmationNumber"
                  className="field"
                  required
                  minLength={6}
                  autoComplete="off"
                  placeholder={tx("Nga faqja zyrtare", "From the official site")}
                />
                <label className="label" htmlFor="filingNotes">
                  {t.common.notes}
                </label>
                <input id="filingNotes" name="notes" className="field" maxLength={500} />
                <button type="submit" className="btn-primary btn-sm w-full">
                  {tx("Regjistro dorëzimin", "Record filing")}
                </button>
              </form>
            ) : (
              <p className="flex items-start gap-2 text-2xs leading-5 text-muted">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {tx(
                  "Dorëzimi regjistrohet vetëm kur rasti është i gatshëm dhe pagesa konfirmuar.",
                  "Filing is recorded only when the case is ready and payment is confirmed.",
                )}
              </p>
            )}
          </SectionCard>

          <SectionCard title={tx("Kërkesa për ndryshim", "Change requests")}>
            {editRequests.length === 0 ? (
              <AdminEmpty text={tx("Nuk ka kërkesa.", "No requests.")} />
            ) : (
              <ul className="space-y-2">
                {editRequests.map((request) => (
                  <li key={request.id} className="rounded-md border border-line p-2.5">
                    <p className="text-[12px] leading-5 text-ink">{request.message}</p>
                    <p className="mt-1 text-2xs text-muted">
                      {formatDateTime(request.createdAt, locale)} · {request.status}
                      {request.resolvedBy ? ` · ${request.resolvedBy}` : ""}
                    </p>
                    {request.status === "open" && canTransition && (
                      <form action={resolveEditRequestAction} className="mt-2 flex gap-1.5">
                        <input type="hidden" name="id" value={request.id} />
                        <input type="hidden" name="redirectTo" value={`/admin/applications/${application.id}`} />
                        <button type="submit" name="status" value="resolved" className="btn-primary btn-sm flex-1">
                          {tx("Zgjidhur", "Resolved")}
                        </button>
                        <button type="submit" name="status" value="declined" className="btn-secondary btn-sm flex-1">
                          {tx("Refuzuar", "Declined")}
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={tx("Të dhëna teknike", "Technical")}>
            <dl className="space-y-1.5 text-2xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">ID</dt>
                <dd className="truncate font-mono">{application.id}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{tx("Krijuar", "Created")}</dt>
                <dd>{formatDateTime(application.createdAt, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{tx("Përditësuar", "Updated")}</dt>
                <dd>{formatDateTime(application.updatedAt, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{tx("Rregullat e çmimit", "Pricing rules")}</dt>
                <dd>{application.pricingRulesVersion}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{tx("Pronari", "Owner")}</dt>
                <dd className="truncate">{sensitive ? application.ownerEmail : maskEmail(application.ownerEmail ?? "—")}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-2 text-2xs">
              <Link href={`/sq/account/${application.id}`} className="inline-flex items-center gap-1 text-forest hover:underline">
                {tx("Pamja e klientit", "Client view")}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
              <Link href={`/admin/audit?q=${application.ref}`} className="inline-flex items-center gap-1 text-forest hover:underline">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {t.admin.nav.audit}
              </Link>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
