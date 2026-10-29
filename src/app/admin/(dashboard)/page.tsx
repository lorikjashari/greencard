import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { AdminPageHeader, AdminEmpty, SectionCard } from "@/components/admin/ui";

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

  const recent = [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const staffCount = users.filter((user) => user.active && user.role !== "client").length;
  const open = isWindowOpen(dvYear);

  const queue = [
    {
      label: tx("Të reja", "New"),
      value: count("submitted"),
      detail: tx("Dorëzuar, pa marrë në punë", "Submitted, not yet claimed"),
      href: "/admin/applications?status=submitted",
      tone: "default" as const,
    },
    {
      label: tx("Në kontroll", "In review"),
      value: count("in_review"),
      detail: tx("Të caktuara ose në pritje", "Assigned or pending review"),
      href: "/admin/review",
      tone: "default" as const,
    },
    {
      label: tx("Kërkohen të dhëna", "Needs information"),
      value: count("needs_information"),
      detail: tx("Klienti duhet të veprojë", "Client action required"),
      href: "/admin/review?status=needs_information",
      tone: count("needs_information") > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: tx("Gati për dorëzim", "Ready to file"),
      value: count("ready_to_file"),
      detail: tx("Pagesa e konfirmuar", "Payment confirmed"),
      href: "/admin/filing",
      tone: count("ready_to_file") > 0 ? ("success" as const) : ("default" as const),
    },
  ];

  const money = [
    { label: tx("Para në pritje", "Cash outstanding"), value: formatCurrency(outstanding, locale), detail: `${pendingCash.length} ${tx("porosi", "orders")}`, href: "/admin/payments/reconciliation", warn: outstanding > 0 },
    { label: tx("Arkëtuar", "Collected"), value: formatCurrency(collected, locale), detail: `${paidOrders.length} ${tx("pagesa", "payments")}`, href: "/admin/payments", warn: false },
    { label: tx("Rimbursuar", "Refunded"), value: formatCurrency(refundedTotal, locale), detail: `${refunded.length} ${tx("pagesa", "payments")}`, href: "/admin/payments", warn: false },
    { label: tx("Dorëzime të regjistruara", "Recorded filings"), value: String(filings.length), detail: `${staffCount} ${tx("staf aktiv", "active staff")}`, href: "/admin/filing", warn: false },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow={`DV ${dvYear.year}`}
        title={tx("Përmbledhje", "Overview")}
        description={tx(
          `Pamje operative për DV ${dvYear.year}. Të dhënat vijnë drejtpërdrejt nga baza e aplikacionit.`,
          `Operational view for DV ${dvYear.year}. Data comes directly from the application database.`,
        )}
        actions={
          <div className="flex items-center gap-2.5 border border-line bg-paper px-3 py-2">
            <span className="font-mono text-[10px] tabular text-muted">
              {formatDate(dvYear.opensAt, locale)} – {formatDate(dvYear.closesAt, locale)}
            </span>
            <span
              className={`chip ${open ? "border-forest-300 bg-forest-50 text-forest-700" : "border-warning/50 bg-warning-50 text-warning"}`}
            >
              {open ? tx("Hapur", "Open") : tx("Mbyllur", "Closed")}
            </span>
          </div>
        }
      />

      {/* Work queue: what needs a person, in priority order. */}
      <div className="mt-5 grid border border-line bg-paper sm:grid-cols-2 sm:divide-x sm:divide-line xl:grid-cols-4">
        {queue.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group border-b border-line p-4 transition-colors last:border-b-0 hover:bg-paper sm:border-b-0 xl:last:border-b-0"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="eyebrow-muted text-[9px]">{item.label}</p>
              <ArrowRight className="h-3 w-3 shrink-0 text-line-strong transition-colors group-hover:text-clay-600" aria-hidden="true" />
            </div>
            <p
              className={`mt-2 font-serif text-[30px] leading-none tabular ${
                item.tone === "warning" && item.value > 0
                  ? "text-warning"
                  : item.tone === "success" && item.value > 0
                    ? "text-forest-700"
                    : "text-forest-900"
              }`}
            >
              {item.value}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-4 text-muted">{item.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid border border-line bg-paper sm:grid-cols-2 sm:divide-x sm:divide-line xl:grid-cols-4">
        {money.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-paper sm:border-b-0"
          >
            <span>
              <span className="block eyebrow-muted text-[9px]">{item.label}</span>
              <span className="mt-1 block text-[10.5px] text-muted">{item.detail}</span>
            </span>
            <span className={`font-mono text-[13px] tabular ${item.warn ? "text-warning" : "text-ink"}`}>{item.value}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <SectionCard
          title={tx("Aplikimet e fundit", "Recent applications")}
          action={
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 font-mono text-3xs uppercase text-forest-700 hover:text-clay-600"
              style={{ letterSpacing: "0.12em" }}
            >
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
                  <tr className="border-b border-line font-mono text-2xs uppercase text-muted">
                    <th className="py-2 pr-3 font-medium">{tx("Referenca", "Reference")}</th>
                    <th className="py-2 pr-3 font-medium">{tx("Aplikanti", "Applicant")}</th>
                    <th className="py-2 pr-3 font-medium">{t.common.status}</th>
                    <th className="py-2 pr-3 font-medium">{t.common.amount}</th>
                    <th className="py-2 font-medium">{tx("Dorëzuar", "Submitted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((application) => (
                    <tr key={application.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-paper">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="font-mono text-[11.5px] font-medium text-forest-800 hover:text-clay-600 hover:underline"
                        >
                          {application.ref}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        {application.applicant.firstName} {application.applicant.lastName}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge kind="application" value={application.status} t={t} />
                      </td>
                      <td className="py-2.5 pr-3 tabular">{formatCurrency(application.amountCents, locale)}</td>
                      <td className="py-2.5 font-mono text-[10.5px] tabular text-muted">{formatDate(application.submittedAt, locale)}</td>
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
            action={
              <span
                className={`font-mono text-[11px] tabular ${attention.length > 0 ? "text-warning" : "text-muted"}`}
              >
                {String(attention.length).padStart(2, "0")}
              </span>
            }
          >
            {attention.length === 0 ? (
              <AdminEmpty text={tx("Asgjë në pritje.", "Nothing pending.")} />
            ) : (
              <ul className="divide-y divide-line">
                {attention.slice(0, 5).map((application) => (
                  <li key={application.id}>
                    <Link
                      href={`/admin/applications/${application.id}`}
                      className="group flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-paper"
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-[11px] font-medium text-forest-800 group-hover:text-clay-600">
                          {application.ref}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted">
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

          <SectionCard title={tx("Roli yt", "Your access")}>
            <dl className="space-y-2 text-[12px]">
              {[
                { label: tx("Staf aktiv", "Active staff"), value: String(staffCount) },
                { label: tx("Roli", "Role"), value: staff.role },
                { label: tx("Aplikime gjithsej", "Total applications"), value: String(applications.length) },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-mono text-[11.5px] text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
