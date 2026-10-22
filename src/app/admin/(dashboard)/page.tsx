import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDollarSign, FileCheck2, Inbox } from "lucide-react";
import { requireStaff } from "@/lib/auth/guards";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { getActiveDvYear, isWindowOpen } from "@/lib/repo/dv-years";
import { listApplications } from "@/lib/repo/applications";
import { listOrders } from "@/lib/repo/orders";
import { listFilings } from "@/lib/repo/filings";
import { listUsers } from "@/lib/repo/users";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, SectionCard, StatCard } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const staff = await requireStaff();
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);

  const [dvYear, applications, orders, filings, users] = await Promise.all([
    getActiveDvYear(),
    listApplications(),
    listOrders(),
    listFilings(),
    listUsers(),
  ]);

  const count = (status: string) => applications.filter((application) => application.status === status).length;
  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingCash = orders.filter((order) => order.status === "pending_cash");
  const refunded = orders.filter((order) => order.status === "refunded");
  const collected = paidOrders.reduce((sum, order) => sum + order.amountCents, 0);
  const outstanding = pendingCash.reduce((sum, order) => sum + order.amountCents, 0);
  const refundedTotal = refunded.reduce((sum, order) => sum + order.amountCents, 0);

  const attention = applications.filter(
    (application) =>
      application.duplicate.level !== "none" ||
      !application.completeness.dataComplete ||
      application.photos.some((photo) => photo.status === "invalid" || photo.status === "rejected"),
  );

  const recent = [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const staffCount = users.filter((user) => user.active && user.role !== "client").length;
  const open = isWindowOpen(dvYear);

  return (
    <div>
      <AdminPageHeader
        title={tx("Përmbledhje", "Overview")}
        description={tx(
          `Pamje operative për DV ${dvYear.year}. Të dhënat vijnë drejtpërdrejt nga baza e aplikacionit.`,
          `Operational view for DV ${dvYear.year}. Data comes directly from the application database.`,
        )}
        actions={
          <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-2xs">
            <CalendarClock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="text-muted">
              {formatDate(dvYear.opensAt, locale)} – {formatDate(dvYear.closesAt, locale)}
            </span>
            <span
              className={`chip ${
                open ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {open ? tx("Hapur", "Open") : tx("Mbyllur", "Closed")}
            </span>
          </div>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label={tx("Të reja", "New")}
          value={count("submitted")}
          detail={tx("Dorëzuar, pa marrë në punë", "Submitted, not yet claimed")}
          href="/admin/applications?status=submitted"
        />
        <StatCard
          label={tx("Në kontroll", "In review")}
          value={count("in_review")}
          detail={tx("Të caktuara ose në pritje", "Assigned or pending review")}
          href="/admin/review"
        />
        <StatCard
          label={tx("Kërkohen të dhëna", "Needs information")}
          value={count("needs_information")}
          detail={tx("Klienti duhet të veprojë", "Client action required")}
          tone={count("needs_information") > 0 ? "warning" : "default"}
          href="/admin/review?status=needs_information"
        />
        <StatCard
          label={tx("Gati për dorëzim", "Ready to file")}
          value={count("ready_to_file")}
          detail={tx("Pagesa e konfirmuar", "Payment confirmed")}
          tone={count("ready_to_file") > 0 ? "success" : "default"}
          href="/admin/filing"
        />
        <StatCard
          label={tx("Para në pritje", "Cash outstanding")}
          value={formatCurrency(outstanding, locale)}
          detail={`${pendingCash.length} ${tx("porosi", "orders")}`}
          tone={outstanding > 0 ? "warning" : "default"}
          href="/admin/payments/reconciliation"
        />
        <StatCard
          label={tx("Arkëtuar", "Collected")}
          value={formatCurrency(collected, locale)}
          detail={`${paidOrders.length} ${tx("pagesa të konfirmuara", "confirmed payments")}`}
          href="/admin/payments"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard
          title={tx("Aplikimet e fundit", "Recent applications")}
          action={
            <Link href="/admin/applications" className="inline-flex items-center gap-1 text-2xs font-semibold text-forest">
              {t.common.all}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <AdminEmpty text={tx("Nuk ka aplikime ende.", "No applications yet.")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-2xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-semibold">{tx("Referenca", "Reference")}</th>
                    <th className="py-2 pr-3 font-semibold">{tx("Aplikanti", "Applicant")}</th>
                    <th className="py-2 pr-3 font-semibold">{t.common.status}</th>
                    <th className="py-2 pr-3 font-semibold">{t.common.amount}</th>
                    <th className="py-2 font-semibold">{tx("Dorëzuar", "Submitted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((application) => (
                    <tr key={application.id} className="border-b border-line/70 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link href={`/admin/applications/${application.id}`} className="font-mono text-xs font-semibold text-forest hover:underline">
                          {application.ref}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        {application.applicant.firstName} {application.applicant.lastName}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge kind="application" value={application.status} t={t} />
                      </td>
                      <td className="py-2.5 pr-3">{formatCurrency(application.amountCents, locale)}</td>
                      <td className="py-2.5 text-muted">{formatDate(application.submittedAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title={tx("Kërkojnë vëmendje", "Needs attention")}
            description={tx(
              "Duplikat, foto problematike ose të dhëna që mungojnë.",
              "Duplicates, problematic photos or missing data.",
            )}
            action={<span className="chip border-amber-200 bg-amber-50 text-amber-800">{attention.length}</span>}
          >
            {attention.length === 0 ? (
              <AdminEmpty text={tx("Asgjë në pritje.", "Nothing pending.")} />
            ) : (
              <ul className="space-y-2">
                {attention.slice(0, 5).map((application) => (
                  <li key={application.id}>
                    <Link
                      href={`/admin/applications/${application.id}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-[12.5px] hover:border-amber-300"
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-2xs font-semibold text-forest">{application.ref}</span>
                        <span className="block truncate text-muted">
                          {application.applicant.firstName} {application.applicant.lastName}
                        </span>
                      </span>
                      <StatusBadge kind="application" value={application.status} t={t} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={tx("Operacione", "Operations")}>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href="/admin/review" className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-ivory">
                  <span className="flex items-center gap-2">
                    <Inbox className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    {t.admin.nav.review}
                  </span>
                  <span className="font-semibold text-forest">{count("submitted") + count("in_review")}</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/filing" className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-ivory">
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    {t.admin.nav.filing}
                  </span>
                  <span className="font-semibold text-forest">{count("ready_to_file")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/payments/reconciliation"
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-ivory"
                >
                  <span className="flex items-center gap-2">
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    {t.admin.nav.reconciliation}
                  </span>
                  <span className="font-semibold text-forest">{pendingCash.length}</span>
                </Link>
              </li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-2xs text-muted">
              <p>
                {tx("Rimbursuar", "Refunded")}: <span className="font-semibold text-ink">{formatCurrency(refundedTotal, locale)}</span>
              </p>
              <p>
                {tx("Dorëzime të regjistruara", "Recorded filings")}:{" "}
                <span className="font-semibold text-ink">{filings.length}</span>
              </p>
              <p>
                {tx("Staf aktiv", "Active staff")}: <span className="font-semibold text-ink">{staffCount}</span>
              </p>
              <p>
                {tx("Roli yt", "Your role")}: <span className="font-semibold text-ink">{staff.role}</span>
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
