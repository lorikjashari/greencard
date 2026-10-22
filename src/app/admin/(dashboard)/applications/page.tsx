import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { hasPermission } from "@/lib/status/transitions";
import { listApplications } from "@/lib/repo/applications";
import { listUsers } from "@/lib/repo/users";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty } from "@/components/admin/ui";
import type { ApplicationStatus, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

const APP_STATUSES: ApplicationStatus[] = [
  "submitted",
  "in_review",
  "needs_information",
  "ready_to_file",
  "filed",
  "confirmation_sent",
  "selected",
  "not_selected",
  "cancelled",
  "expired",
  "rejected",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "created",
  "pending_cash",
  "pending_card",
  "paid",
  "refunded",
  "disputed",
  "failed",
  "expired",
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireAdminPage("applications.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const raw = await searchParams;

  const value = (key: string) => {
    const item = raw[key];
    return typeof item === "string" ? item : "";
  };

  const q = value("q").trim();
  const status = value("status");
  const payment = value("payment");
  const packageKey = value("package");
  const attention = value("attention") === "1";
  const page = Math.max(1, Number(value("page")) || 1);
  const pageSize = 20;

  const all = await listApplications({
    status: status && APP_STATUSES.includes(status as ApplicationStatus) ? [status as ApplicationStatus] : undefined,
    packageKey: packageKey || undefined,
    needsAttention: attention || undefined,
    query: q || undefined,
  });
  const filtered = payment ? all.filter((application) => application.paymentStatus === payment) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const users = await listUsers();
  const assignees = new Map(users.map((user) => [user.id, user]));
  const sensitive = hasPermission(staff.role, "applications.view_sensitive");
  const canExport = hasPermission(staff.role, "applications.export");

  const queryFor = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (packageKey) params.set("package", packageKey);
    if (attention) params.set("attention", "1");
    for (const [key, val] of Object.entries(overrides)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    return params.toString();
  };

  const packageLabel = (key: string) =>
    key === "individual" ? t.common.pkgIndividual : key === "couple" ? t.common.pkgCouple : t.common.pkgFamily;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.applications}
        description={tx(
          "Kërko, filtro dhe hap rastet. Vetëm stafi i autorizuar shikon të dhënat e ndjeshme.",
          "Search, filter and open cases. Only authorised staff see sensitive data.",
        )}
        actions={
          canExport ? (
            <a href={`/api/admin/export?type=applications&${queryFor()}`} className="btn-secondary btn-sm">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              CSV
            </a>
          ) : null
        }
      />

      <form method="get" className="mt-6 rounded-lg border border-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]">
          <div>
            <label className="label" htmlFor="q">
              {t.common.search}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
              <input
                id="q"
                name="q"
                defaultValue={q}
                className="field pl-8"
                placeholder={tx("Referenca, emri, email ose telefoni", "Reference, name, email or phone")}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="status">
              {t.common.status}
            </label>
            <select id="status" name="status" defaultValue={status} className="field">
              <option value="">{t.common.all}</option>
              {APP_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {t.status[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="payment">
              {t.account.payment}
            </label>
            <select id="payment" name="payment" defaultValue={payment} className="field">
              <option value="">{t.common.all}</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {t.status[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="package">
              {t.apply.step1}
            </label>
            <select id="package" name="package" defaultValue={packageKey} className="field">
              <option value="">{t.common.all}</option>
              <option value="individual">{t.common.pkgIndividual}</option>
              <option value="couple">{t.common.pkgCouple}</option>
              <option value="family">{t.common.pkgFamily}</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary btn-sm">
              {t.common.filter}
            </button>
            <Link href="/admin/applications" className="btn-secondary btn-sm">
              {t.common.reset}
            </Link>
          </div>
        </div>

        <label className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-ink">
          <input type="checkbox" name="attention" value="1" defaultChecked={attention} className="h-4 w-4" />
          {tx("Vetëm rastet që kërkojnë vëmendje", "Only cases needing attention")}
        </label>
      </form>

      <p className="mt-4 text-2xs text-muted">
        {filtered.length} {tx("rezultate", "results")} · {tx("faqja", "page")} {currentPage}/{totalPages}
        {!sensitive && (
          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
            {tx("Të dhëna të ndjeshme të fshehura", "Sensitive fields hidden")}
          </span>
        )}
      </p>

      <div className="mt-2 rounded-lg border border-line bg-white">
        {rows.length === 0 ? (
          <div className="p-4">
            <AdminEmpty text={tx("Asnjë aplikim nuk përputhet me filtrat.", "No applications match the filters.")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-2xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-semibold">{tx("Referenca", "Reference")}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Aplikanti", "Applicant")}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.apply.step1}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.common.status}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.account.payment}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.common.amount}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Dorëzuar", "Submitted")}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Caktuar", "Assignee")}</th>
                  <th className="px-4 py-2.5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {rows.map((application) => {
                  const assignee = application.assigneeId ? assignees.get(application.assigneeId) : null;
                  const flagged =
                    application.duplicate.level !== "none" ||
                    !application.completeness.dataComplete ||
                    application.photos.some((photo) => photo.status === "invalid" || photo.status === "rejected");

                  return (
                    <tr key={application.id} className="border-b border-line/70 last:border-0 hover:bg-ivory/60">
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="font-mono text-xs font-semibold text-forest hover:underline"
                        >
                          {application.ref}
                        </Link>
                        {flagged && (
                          <span className="mt-1 flex items-center gap-1 text-2xs text-amber-700">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {tx("Vëmendje", "Attention")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="font-medium text-ink">
                          {application.applicant.firstName} {application.applicant.lastName}
                        </span>
                        <span className="mt-0.5 block text-2xs text-muted">
                          {sensitive ? application.contact.email : `${application.contact.email.slice(0, 2)}***`}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">{packageLabel(application.packageKey)}</td>
                      <td className="px-3 py-3 align-top">
                        <StatusBadge kind="application" value={application.status} t={t} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                      </td>
                      <td className="px-3 py-3 align-top">{formatCurrency(application.amountCents, locale)}</td>
                      <td className="px-3 py-3 align-top text-muted">{formatDate(application.submittedAt, locale)}</td>
                      <td className="px-3 py-3 align-top text-muted">{assignee?.name ?? "—"}</td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="text-2xs font-semibold text-forest hover:underline"
                        >
                          {t.common.details}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
          {currentPage > 1 ? (
            <Link
              href={`/admin/applications?${queryFor({ page: String(currentPage - 1) })}`}
              className="btn-secondary btn-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {tx("Përpara", "Previous")}
            </Link>
          ) : (
            <span />
          )}
          {currentPage < totalPages ? (
            <Link
              href={`/admin/applications?${queryFor({ page: String(currentPage + 1) })}`}
              className="btn-secondary btn-sm"
            >
              {tx("Tjetra", "Next")}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
