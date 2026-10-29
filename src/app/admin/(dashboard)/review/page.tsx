import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { hasPermission } from "@/lib/status/transitions";
import { listApplications } from "@/lib/repo/applications";
import { listUsers } from "@/lib/repo/users";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, AdminNotice, StatCard, StatStrip } from "@/components/admin/ui";
import { changeStatusAction } from "@/app/admin/actions";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

const OPEN: ApplicationStatus[] = ["submitted", "in_review", "needs_information"];

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; notice?: string; error?: string }>;
}) {
  const staff = await requireAdminPage("applications.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { status, q, notice, error } = await searchParams;

  const canTransition = hasPermission(staff.role, "applications.transition");
  const [allOpen, users] = await Promise.all([
    listApplications({ status: OPEN }),
    listUsers(),
  ]);
  const assignees = new Map(users.map((user) => [user.id, user]));

  const filteredStatus =
    status && OPEN.includes(status as ApplicationStatus) ? (status as ApplicationStatus) : null;
  const rows = allOpen
    .filter((application) => (filteredStatus ? application.status === filteredStatus : true))
    .filter((application) => {
      if (!q?.trim()) return true;
      const haystack = `${application.ref} ${application.applicant.firstName} ${application.applicant.lastName} ${application.contact.email}`.toLowerCase();
      return haystack.includes(q.trim().toLowerCase());
    })
    .sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt));

  const count = (value: ApplicationStatus) => allOpen.filter((application) => application.status === value).length;

  const tabs = [
    { key: "", label: tx("Të gjitha", "All"), count: allOpen.length },
    { key: "submitted", label: t.status.submitted, count: count("submitted") },
    { key: "in_review", label: t.status.in_review, count: count("in_review") },
    { key: "needs_information", label: t.status.needs_information, count: count("needs_information") },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.review}
        description={tx(
          "Radha e rasteve të hapura, më e vjetra e para. Kontrollo të dhënat, fotot dhe pagesën para se ta shpallësh gati.",
          "Open cases, oldest first. Check data, photos and payment before marking ready.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <StatStrip>
        <StatCard label={t.status.submitted} value={count("submitted")} detail={tx("Në pritje për marrje në punë", "Awaiting claim")} tone={count("submitted") > 0 ? "warning" : "default"} />
        <StatCard label={t.status.in_review} value={count("in_review")} detail={tx("Në kontroll aktiv", "Actively reviewed")} />
        <StatCard label={t.status.needs_information} value={count("needs_information")} detail={tx("Në pritje të klientit", "Waiting on the client")} />
      </StatStrip>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/review${tab.key ? `?status=${tab.key}` : ""}`}
              className={`chip ${
                (filteredStatus ?? "") === tab.key
                  ? "border-forest-200 bg-forest-50 text-forest-800"
                  : "border-line bg-paper text-muted hover:border-forest-200"
              }`}
            >
              {tab.label} <span className="font-semibold">{tab.count}</span>
            </Link>
          ))}
        </div>
        <form method="get" className="flex items-center gap-2">
          {filteredStatus && <input type="hidden" name="status" value={filteredStatus} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q ?? ""}
              className="field w-56 pl-8"
              placeholder={tx("Kërko në radhë", "Search queue")}
              aria-label={t.common.search}
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm">
            {t.common.search}
          </button>
        </form>
      </div>

      <div className="mt-3 space-y-3">
        {rows.length === 0 ? (
          <div className="border border-line bg-paper p-4">
            <AdminEmpty text={tx("Radha është bosh.", "The queue is empty.")} />
          </div>
        ) : (
          rows.map((application) => {
            const days = Math.max(
              0,
              Math.floor((Date.now() - new Date(application.submittedAt ?? application.createdAt).getTime()) / 86_400_000),
            );
            const assignee = application.assigneeId ? assignees.get(application.assigneeId) : null;
            const photosOk = application.completeness.photosApproved;
            const dataOk = application.completeness.dataComplete;
            const paymentOk = application.paymentStatus === "paid";

            return (
              <article key={application.id} className="border border-line bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/applications/${application.id}`}
                        className="font-mono text-xs font-semibold text-forest-800 hover:text-clay-600 hover:underline"
                      >
                        {application.ref}
                      </Link>
                      <StatusBadge kind="application" value={application.status} t={t} />
                      <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-ink">
                      {application.applicant.firstName} {application.applicant.lastName}
                    </p>
                    <p className="mt-0.5 text-2xs text-muted">
                      {application.packageKey === "individual"
                        ? t.common.pkgIndividual
                        : application.packageKey === "couple"
                          ? t.common.pkgCouple
                          : t.common.pkgFamily}{" "}
                      · {formatCurrency(application.amountCents, locale)} · {tx("dorëzuar", "submitted")}{" "}
                      {formatDate(application.submittedAt, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-2xs">
                    <span className={`chip ${dataOk ? "border-forest-300 bg-forest-50 text-forest-700" : "border-warning/40 bg-warning-50 text-warning"}`}>
                      {dataOk ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                      {tx("Të dhëna", "Data")}
                    </span>
                    <span className={`chip ${photosOk ? "border-forest-300 bg-forest-50 text-forest-700" : "border-warning/40 bg-warning-50 text-warning"}`}>
                      {photosOk ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                      {tx("Foto", "Photos")}
                    </span>
                    <span className={`chip ${paymentOk ? "border-forest-300 bg-forest-50 text-forest-700" : "border-warning/40 bg-warning-50 text-warning"}`}>
                      {paymentOk ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}
                      {tx("Pagesa", "Payment")}
                    </span>
                    {application.duplicate.level !== "none" && (
                      <span className="chip border-warning/40 bg-warning-50 text-warning">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {tx("Duplikat", "Duplicate")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-2xs text-muted">
                  <span>
                    {tx("Në radhë", "In queue")}: <strong className="text-ink">{days}</strong> {tx("ditë", "days")} ·{" "}
                    {tx("Caktuar", "Assignee")}: <strong className="text-ink">{assignee?.name ?? "—"}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    {canTransition && application.status === "submitted" && (
                      <form action={changeStatusAction}>
                        <input type="hidden" name="applicationId" value={application.id} />
                        <input type="hidden" name="status" value="in_review" />
                        <input type="hidden" name="redirectTo" value="/admin/review" />
                        <button type="submit" className="btn-primary btn-sm">
                          {tx("Merr në punë", "Claim for review")}
                        </button>
                      </form>
                    )}
                    <Link href={`/admin/applications/${application.id}`} className="btn-secondary btn-sm">
                      {t.common.details}
                    </Link>
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
