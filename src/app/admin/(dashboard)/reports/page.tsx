import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listApplications } from "@/lib/repo/applications";
import { listOrders } from "@/lib/repo/orders";
import { listFilings } from "@/lib/repo/filings";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdminPageHeader, AdminEmpty, SectionCard, StatCard } from "@/components/admin/ui";
import type { ApplicationStatus, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

function Bars({
  rows,
  emptyLabel,
  formatValue,
}: {
  rows: Array<{ label: string; value: number; detail?: string }>;
  emptyLabel: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  if (rows.length === 0) return <p className="text-2xs text-muted">{emptyLabel}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-center justify-between gap-3 text-2xs">
            <span className="text-ink">{row.label}</span>
            <span className="font-semibold text-ink">{formatValue ? formatValue(row.value) : row.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ivory">
            <div className="h-full rounded-full bg-forest" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
          </div>
          {row.detail && <p className="mt-0.5 text-2xs text-muted">{row.detail}</p>}
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage() {
  await requireAdminPage("reports.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);

  const dvYear = await getActiveDvYear();
  const [applications, orders, filings] = await Promise.all([
    listApplications({ dvYear: dvYear.year }),
    listOrders(),
    listFilings(dvYear.year),
  ]);
  const appsById = new Map(applications.map((application) => [application.id, application]));
  const scopedOrders = orders.filter((order) => appsById.has(order.applicationId));

  const statusCounts = applications.reduce<Record<string, number>>((acc, application) => {
    acc[application.status] = (acc[application.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusRows = (Object.entries(statusCounts) as Array<[ApplicationStatus, number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ label: t.status[status], value: count }));

  const packageRows = (["individual", "couple", "family"] as const).map((key) => ({
    label: key === "individual" ? t.common.pkgIndividual : key === "couple" ? t.common.pkgCouple : t.common.pkgFamily,
    value: applications.filter((application) => application.packageKey === key).length,
  }));

  const paymentRows = (["pending_cash", "paid", "refunded", "failed"] as PaymentStatus[]).map((status) => ({
    label: t.status[status],
    value: scopedOrders.filter((order) => order.status === status).length,
  }));

  const months: string[] = [];
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    months.push(date.toISOString().slice(0, 7));
  }
  const monthLabel = (month: string) =>
    new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", { month: "short", year: "2-digit" }).format(
      new Date(`${month}-01T00:00:00Z`),
    );
  const monthlyRows = months.map((month) => ({
    label: monthLabel(month),
    value: applications.filter((application) => (application.submittedAt ?? application.createdAt).slice(0, 7) === month).length,
  }));

  const revenueRows = months.map((month) => {
    const cents = scopedOrders
      .filter((order) => order.status === "paid" && (order.paidAt ?? order.updatedAt).slice(0, 7) === month)
      .reduce((sum, order) => sum + (order.receivedAmountCents ?? order.amountCents), 0);
    return { label: monthLabel(month), value: cents };
  });

  const paid = scopedOrders.filter((order) => order.status === "paid");
  const collected = paid.reduce((sum, order) => sum + (order.receivedAmountCents ?? order.amountCents), 0);
  const outstanding = scopedOrders
    .filter((order) => order.status === "pending_cash")
    .reduce((sum, order) => sum + order.amountCents, 0);
  const refunded = scopedOrders
    .filter((order) => order.status === "refunded")
    .reduce((sum, order) => sum + order.amountCents, 0);

  const filedStatuses: ApplicationStatus[] = ["filed", "confirmation_sent", "selected", "not_selected"];
  const filed = applications.filter((application) => filedStatuses.includes(application.status)).length;
  const conversion = applications.length > 0 ? Math.round((filed / applications.length) * 100) : 0;

  const photoRejections = applications.reduce(
    (sum, application) => sum + application.photos.filter((photo) => photo.status === "rejected").length,
    0,
  );
  const duplicates = applications.filter((application) => application.duplicate.level !== "none").length;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.reports}
        description={tx(
          `Të dhëna reale për DV ${dvYear.year}. Pa vlera të simuluara; bosh do të thotë bosh.`,
          `Real data for DV ${dvYear.year}. No simulated values; empty means empty.`,
        )}
        actions={
          <div className="flex gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/export?type=applications" className="btn-secondary btn-sm">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {tx("Aplikime CSV", "Applications CSV")}
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/export?type=payments" className="btn-secondary btn-sm">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {tx("Pagesa CSV", "Payments CSV")}
            </a>
          </div>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={tx("Aplikime", "Applications")} value={applications.length} detail={`DV ${dvYear.year}`} />
        <StatCard label={tx("Dorëzuar", "Filed")} value={filed} detail={`${filings.length} ${tx("konfirmime", "confirmations")}`} tone="success" />
        <StatCard label={tx("Konvertim", "Conversion")} value={`${conversion}%`} detail={tx("Dorëzuar / aplikime", "Filed / applications")} />
        <StatCard label={tx("Arkëtuar", "Collected")} value={formatCurrency(collected, locale)} detail={`${tx("Rimbursuar", "Refunded")}: ${formatCurrency(refunded, locale)}`} />
        <StatCard label={tx("Cash në pritje", "Cash outstanding")} value={formatCurrency(outstanding, locale)} tone={outstanding > 0 ? "warning" : "default"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title={tx("Aplikime sipas statusit", "Applications by status")}>
          <Bars rows={statusRows} emptyLabel={tx("Nuk ka aplikime.", "No applications.")} />
        </SectionCard>
        <SectionCard title={tx("Paketat", "Packages")}>
          <Bars rows={packageRows} emptyLabel={tx("Nuk ka aplikime.", "No applications.")} />
        </SectionCard>
        <SectionCard title={tx("Dorëzime sipas muajit", "Submissions by month")}>
          <Bars rows={monthlyRows} emptyLabel={tx("Nuk ka të dhëna.", "No data.")} />
        </SectionCard>
        <SectionCard title={tx("Arkëtime sipas muajit", "Receipts by month")}>
          <Bars rows={revenueRows} emptyLabel={tx("Nuk ka arkëtime.", "No receipts.")} formatValue={(value) => formatCurrency(value, locale)} />
        </SectionCard>
        <SectionCard title={tx("Pagesat", "Payments")}>
          <Bars rows={paymentRows} emptyLabel={tx("Nuk ka porosi.", "No orders.")} />
        </SectionCard>
        <SectionCard title={tx("Cilësia e të dhënave", "Data quality")}>
          <dl className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted">{tx("Duplikat të mundshëm", "Possible duplicates")}</dt>
              <dd className="font-semibold text-ink">{duplicates}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{tx("Foto të refuzuara", "Rejected photos")}</dt>
              <dd className="font-semibold text-ink">{photoRejections}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{tx("Të dhëna që mungojnë", "Missing data")}</dt>
              <dd className="font-semibold text-ink">
                {applications.filter((application) => !application.completeness.dataComplete).length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{tx("Fotot e aprovuara", "Photos approved")}</dt>
              <dd className="font-semibold text-ink">
                {applications.filter((application) => application.completeness.photosApproved).length}
              </dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-line pt-2 text-2xs text-muted">
            {tx("Dritarja e konfiguruar", "Configured window")}: {formatDate(dvYear.opensAt, locale)} – {formatDate(dvYear.closesAt, locale)}
          </p>
        </SectionCard>
      </div>

      {applications.length === 0 && (
        <div className="mt-5 rounded-lg border border-line bg-white p-4">
          <AdminEmpty text={tx("Nuk ka të dhëna për këtë vit DV.", "No data for this DV year.")} />
        </div>
      )}
    </div>
  );
}
