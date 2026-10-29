import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { hasPermission } from "@/lib/status/transitions";
import { listOrders } from "@/lib/repo/orders";
import { listApplications } from "@/lib/repo/applications";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, StatCard, StatStrip } from "@/components/admin/ui";
import type { PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

const STATUSES: PaymentStatus[] = [
  "created",
  "pending_cash",
  "pending_card",
  "paid",
  "refunded",
  "disputed",
  "failed",
  "expired",
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; method?: string }>;
}) {
  const staff = await requireAdminPage("payments.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { q, status, method } = await searchParams;

  const [orders, applications] = await Promise.all([listOrders(), listApplications()]);
  const apps = new Map(applications.map((application) => [application.id, application]));

  const filtered = orders
    .filter((order) => (status && STATUSES.includes(status as PaymentStatus) ? order.status === status : true))
    .filter((order) => (method ? order.method === method : true))
    .filter((order) => {
      if (!q?.trim()) return true;
      const application = apps.get(order.applicationId);
      const haystack = `${order.ref} ${order.providerRef ?? ""} ${application?.ref ?? ""} ${application?.applicant.firstName ?? ""} ${application?.applicant.lastName ?? ""}`.toLowerCase();
      return haystack.includes(q.trim().toLowerCase());
    });

  const paid = orders.filter((order) => order.status === "paid");
  const pending = orders.filter((order) => order.status === "pending_cash");
  const refunded = orders.filter((order) => order.status === "refunded");
  const mismatch = orders.filter((order) => order.amountMismatch);
  const collected = paid.reduce((sum, order) => sum + order.amountCents, 0);
  const outstanding = pending.reduce((sum, order) => sum + order.amountCents, 0);
  const refundedTotal = refunded.reduce((sum, order) => sum + order.amountCents, 0);

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.payments}
        description={tx(
          "Porositë dhe arkëtimet. Vetëm stafi i autorizuar regjistron pagesa; statusi vjen nga transaksionet.",
          "Orders and receipts. Only authorised staff record payments; status comes from transactions.",
        )}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/payments/reconciliation" className="btn-secondary btn-sm">
              {t.admin.nav.reconciliation}
            </Link>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/export?type=payments" className="btn-secondary btn-sm">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              CSV
            </a>
          </div>
        }
      />

      <StatStrip>
        <StatCard label={tx("Arkëtuar", "Collected")} value={formatCurrency(collected, locale)} detail={`${paid.length} ${tx("pagesa", "payments")}`} tone="success" />
        <StatCard label={tx("Në pritje", "Outstanding")} value={formatCurrency(outstanding, locale)} detail={`${pending.length} ${tx("porosi cash", "cash orders")}`} tone={pending.length > 0 ? "warning" : "default"} href="/admin/payments/reconciliation" />
        <StatCard label={tx("Rimbursuar", "Refunded")} value={formatCurrency(refundedTotal, locale)} detail={`${refunded.length} ${tx("raste", "cases")}`} />
        <StatCard label={tx("Mospërputhje", "Mismatches")} value={mismatch.length} detail={tx("Kërkojnë shpjegim", "Need explanation")} tone={mismatch.length > 0 ? "danger" : "default"} />
      </StatStrip>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/admin/payments" className={`chip ${!status ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}>
            {t.common.all}
          </Link>
          {(["pending_cash", "paid", "refunded", "failed"] as PaymentStatus[]).map((value) => (
            <Link
              key={value}
              href={`/admin/payments?status=${value}`}
              className={`chip ${status === value ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}
            >
              {t.status[value]}
            </Link>
          ))}
        </div>

        <form method="get" className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="method" defaultValue={method ?? ""} className="field w-32" aria-label={tx("Metoda", "Method")}>
            <option value="">{tx("Të gjitha", "All")}</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q ?? ""}
              className="field w-56 pl-8"
              placeholder={tx("Referenca ose aplikanti", "Reference or applicant")}
              aria-label={t.common.search}
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm">
            {t.common.filter}
          </button>
        </form>
      </div>

      <div className="mt-3 border border-line bg-paper">
        {filtered.length === 0 ? (
          <div className="p-4">
            <AdminEmpty text={tx("Nuk ka porosi në këtë filtër.", "No orders in this filter.")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line font-mono text-2xs uppercase text-muted">
                  <th className="px-4 py-2.5 font-semibold">{tx("Porosia", "Order")}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Aplikimi", "Application")}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.common.amount}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Metoda", "Method")}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.common.status}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Krijuar", "Created")}</th>
                  <th className="px-3 py-2.5 font-semibold">{tx("Arkëtuar", "Received")}</th>
                  <th className="px-4 py-2.5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const application = apps.get(order.applicationId);
                  return (
                    <tr key={order.id} className="border-b border-line/70 last:border-0 hover:bg-paper">
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-xs font-semibold text-ink">{order.ref}</span>
                        {order.amountMismatch && (
                          <span className="mt-1 flex items-center gap-1 text-2xs text-warning">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {tx("Mospërputhje", "Mismatch")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {application ? (
                          <Link href={`/admin/applications/${application.id}`} className="text-forest-800 hover:text-clay-600 hover:underline">
                            <span className="font-mono text-2xs font-semibold">{application.ref}</span>
                            <span className="mt-0.5 block text-2xs text-muted">
                              {application.applicant.firstName} {application.applicant.lastName}
                            </span>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">{formatCurrency(order.amountCents, locale)}</td>
                      <td className="px-3 py-3 align-top capitalize">{order.method}</td>
                      <td className="px-3 py-3 align-top">
                        <StatusBadge kind="payment" value={order.status} t={t} />
                      </td>
                      <td className="px-3 py-3 align-top text-muted">{formatDate(order.createdAt, locale)}</td>
                      <td className="px-3 py-3 align-top">
                        {order.receivedAmountCents != null ? (
                          <>
                            <span className="block">{formatCurrency(order.receivedAmountCents, locale)}</span>
                            <span className="text-2xs text-muted">
                              {order.receivingMethod} · {formatDate(order.receivedAt, locale)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {application && (
                          <Link href={`/admin/applications/${application.id}`} className="text-2xs font-semibold text-forest-800 hover:text-clay-600 hover:underline">
                            {hasPermission(staff.role, "payments.reconcile") && order.status === "pending_cash"
                              ? tx("Regjistro", "Record")
                              : t.common.details}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orders.some((order) => order.status === "pending_card") && (
        <p className="mt-4 border border-warning/40 bg-warning-50 p-3 text-2xs leading-5 text-warning">
          {tx(
            "Ka porosi me kartë në pritje. Mos i shëno si të paguara manualisht: konfirmimi vjen vetëm nga webhook-u i ofruesit.",
            "There are pending card orders. Do not mark them paid manually: confirmation comes only from the provider webhook.",
          )}
        </p>
      )}
    </div>
  );
}
