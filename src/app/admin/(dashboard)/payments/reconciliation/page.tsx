import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listOrders } from "@/lib/repo/orders";
import { listApplications } from "@/lib/repo/applications";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, AdminNotice, StatCard } from "@/components/admin/ui";
import { recordCashAction, reviewPaymentMismatchAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Cash reconciliation" };
export const dynamic = "force-dynamic";

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdminPage("payments.reconcile");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { notice, error } = await searchParams;

  const [orders, applications] = await Promise.all([listOrders(), listApplications()]);
  const apps = new Map(applications.map((application) => [application.id, application]));

  const pending = orders
    .filter((order) => order.status === "pending_cash")
    .sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""));
  const recentlyPaid = orders
    .filter((order) => order.status === "paid")
    .sort((a, b) => (b.receivedAt ?? b.paidAt ?? "").localeCompare(a.receivedAt ?? a.paidAt ?? ""))
    .slice(0, 10);
  const mismatches = orders.filter((order) => order.amountMismatch);
  const unreviewedMismatches = mismatches
    .filter((order) => !order.mismatchReviewedAt)
    .sort((a, b) => (a.receivedAt ?? "").localeCompare(b.receivedAt ?? ""));
  const overdue = pending.filter((order) => order.expiresAt && new Date(order.expiresAt) < new Date());
  const total = pending.reduce((sum, order) => sum + order.amountCents, 0);

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.reconciliation}
        description={tx(
          "Regjistro arkëtimin real. Shuma e marrë ruhet veçmas nga shuma e porosisë; çdo diferencë kërkon shënim.",
          "Record the actual receipt. The received amount is stored separately from the order amount; any difference requires a note.",
        )}
        actions={
          <Link href="/admin/payments" className="btn-secondary btn-sm">
            {t.admin.nav.payments}
          </Link>
        }
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label={tx("Cash në pritje", "Cash pending")} value={formatCurrency(total, locale)} detail={`${pending.length} ${tx("porosi", "orders")}`} tone={pending.length > 0 ? "warning" : "default"} />
        <StatCard label={tx("Të vonuara", "Overdue")} value={overdue.length} detail={tx("Kaluar afati i pagesës", "Past the payment deadline")} tone={overdue.length > 0 ? "danger" : "default"} />
        <StatCard label={tx("Mospërputhje", "Mismatches")} value={mismatches.length} detail={tx("Shuma e marrë ≠ porosia", "Received ≠ order amount")} />
      </div>

      <section className="mt-6 rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-ink">{tx("Porositë cash të hapura", "Open cash orders")}</h2>
          <p className="mt-0.5 text-2xs text-muted">
            {tx("Renditur sipas afatit. Regjistrimi krijon event pagese dhe përditëson statusin e aplikimit.", "Ordered by deadline. Recording creates a payment event and updates the application status.")}
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="p-4">
            <AdminEmpty text={tx("Nuk ka cash në pritje.", "No cash outstanding.")} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((order) => {
              const application = apps.get(order.applicationId);
              const isOverdue = order.expiresAt ? new Date(order.expiresAt) < new Date() : false;
              return (
                <li key={order.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-ink">{order.ref}</p>
                      <p className="mt-1 text-[13px]">
                        {application ? (
                          <Link href={`/admin/applications/${application.id}`} className="text-forest hover:underline">
                            {application.ref} · {application.applicant.firstName} {application.applicant.lastName}
                          </Link>
                        ) : (
                          tx("Aplikimi nuk u gjet", "Application not found")
                        )}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-2xs text-muted">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {t.complete.deadline}: {formatDate(order.expiresAt, locale)}
                        {isOverdue && (
                          <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-700">
                            {tx("Vonuar", "Overdue")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg text-forest-900">{formatCurrency(order.amountCents, locale)}</p>
                      <StatusBadge kind="payment" value={order.status} t={t} />
                    </div>
                  </div>

                  <form action={recordCashAction} className="mt-3 grid gap-2 rounded-md bg-ivory/60 p-3 sm:grid-cols-2 lg:grid-cols-[8rem_9rem_9rem_minmax(0,1fr)_auto] lg:items-end">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value="/admin/payments/reconciliation" />
                    <div>
                      <label className="label" htmlFor={`amount-${order.id}`}>
                        {t.common.amount}
                      </label>
                      <input
                        id={`amount-${order.id}`}
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
                      <label className="label" htmlFor={`date-${order.id}`}>
                        {tx("Data", "Date")}
                      </label>
                      <input
                        id={`date-${order.id}`}
                        name="receivedAt"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`method-${order.id}`}>
                        {tx("Mënyra", "Method")}
                      </label>
                      <select id={`method-${order.id}`} name="receivingMethod" className="field" defaultValue="office">
                        <option value="office">{tx("Zyrë", "Office")}</option>
                        <option value="post">{tx("Postë", "Post")}</option>
                        <option value="bank">{tx("Bankë", "Bank")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`note-${order.id}`}>
                        {tx("Shënim / prova", "Note / evidence")}
                      </label>
                      <input id={`note-${order.id}`} name="note" className="field" maxLength={500} />
                    </div>
                    <button type="submit" className="btn-primary btn-sm">
                      {tx("Konfirmo", "Confirm")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-ink">
            {tx("Mospërputhjet që presin shqyrtim", "Mismatches awaiting review")}
          </h2>
          <p className="mt-0.5 text-2xs text-muted">
            {tx(
              "Dorëzimi bllokohet derisa diferenca të dokumentohet. Shënimi ruhet në auditim dhe në dosje.",
              "Filing is blocked until the difference is documented. The note is stored in audit and on the case.",
            )}
          </p>
        </div>
        {unreviewedMismatches.length === 0 ? (
          <div className="p-4">
            <AdminEmpty text={tx("Nuk ka mospërputhje të pashqyrtuara.", "No unreviewed mismatches.")} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {unreviewedMismatches.map((order) => {
              const application = apps.get(order.applicationId);
              return (
                <li key={order.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-ink">{order.ref}</p>
                      <p className="mt-1 text-[13px]">
                        {application ? (
                          <Link href={`/admin/applications/${application.id}`} className="text-forest hover:underline">
                            {application.ref} · {application.applicant.firstName} {application.applicant.lastName}
                          </Link>
                        ) : (
                          tx("Aplikimi nuk u gjet", "Application not found")
                        )}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted">
                        {tx("Arkëtuar", "Received")}: {formatCurrency(order.receivedAmountCents ?? 0, locale)} ·{" "}
                        {tx("Porosia", "Order")}: {formatCurrency(order.amountCents, locale)} ·{" "}
                        {formatDateTime(order.receivedAt, locale)}
                      </p>
                      {order.evidenceNote && (
                        <p className="mt-1 text-2xs text-muted">{order.evidenceNote}</p>
                      )}
                    </div>
                    <StatusBadge kind="payment" value={order.status} t={t} />
                  </div>
                  <form action={reviewPaymentMismatchAction} className="mt-3 flex flex-col gap-2 rounded-md bg-amber-50/60 p-3 sm:flex-row sm:items-end">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value="/admin/payments/reconciliation" />
                    <div className="min-w-0 flex-1">
                      <label className="label" htmlFor={`review-note-${order.id}`}>
                        {tx("Vendimi / arsyeja", "Decision / reason")}
                      </label>
                      <input
                        id={`review-note-${order.id}`}
                        name="note"
                        className="field"
                        maxLength={500}
                        minLength={5}
                        required
                        placeholder={tx("P.sh. diferenca u arkëtua më vonë / u fal", "E.g. balance collected later / waived")}
                      />
                    </div>
                    <button type="submit" className="btn-primary btn-sm">
                      {tx("Shëno si të shqyrtuar", "Mark reviewed")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white">
        <div className="border-b border-line px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-ink">{tx("Arkëtimet e fundit", "Recent receipts")}</h2>
        </div>
        {recentlyPaid.length === 0 ? (
          <div className="p-4">
            <AdminEmpty text={tx("Nuk ka arkëtime.", "No receipts yet.")} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recentlyPaid.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[12.5px]">
                <div>
                  <p className="font-mono text-2xs font-semibold text-ink">{order.ref}</p>
                  <p className="text-2xs text-muted">
                    {order.receivingMethod} · {formatDateTime(order.receivedAt, locale)} · {order.receivedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.amountMismatch ? (
                    <span className="flex items-center gap-1 text-2xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      {formatCurrency(order.receivedAmountCents ?? 0, locale)} / {formatCurrency(order.amountCents, locale)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-2xs text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {formatCurrency(order.receivedAmountCents ?? order.amountCents, locale)}
                    </span>
                  )}
                  <StatusBadge kind="payment" value={order.status} t={t} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
