import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listAudit } from "@/lib/repo/audit";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminEmpty, SectionCard } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entityType?: string }>;
}) {
  await requireAdminPage("audit.view");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { q, action, entityType } = await searchParams;

  const rows = await listAudit({
    query: q?.trim() || undefined,
    action: action?.trim() || undefined,
    entityType: entityType?.trim() || undefined,
    limit: 250,
  });

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.audit}
        description={tx(
          "Regjistër i pandryshueshëm i veprimeve të stafit dhe ngjarjeve të ndjeshme. 250 hyrjet më të fundit.",
          "Append-only record of staff actions and sensitive events. The latest 250 entries.",
        )}
      />

      <form method="get" className="mt-5 grid gap-2 border border-line bg-paper p-4 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="q">
            {t.common.search}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              id="q"
              name="q"
              defaultValue={q ?? ""}
              className="field pl-8"
              placeholder={tx("Aktori, përmbledhja ose ID", "Actor, summary or ID")}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="entityType">
            {tx("Entiteti", "Entity")}
          </label>
          <select id="entityType" name="entityType" defaultValue={entityType ?? ""} className="field">
            <option value="">{t.common.all}</option>
            {["application", "order", "user", "settings", "dv_year", "notification", "data_request", "edit_request"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="action">
            {tx("Veprimi", "Action")}
          </label>
          <input id="action" name="action" defaultValue={action ?? ""} className="field" placeholder="application.status_changed" />
        </div>
        <button type="submit" className="btn-primary btn-sm">
          {t.common.filter}
        </button>
      </form>

      <SectionCard
        title={`${rows.length} ${tx("hyrje", "entries")}`}
        className="mt-4"
      >
        {rows.length === 0 ? (
          <AdminEmpty text={tx("Nuk ka hyrje që përputhen.", "No matching entries.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line font-mono text-2xs uppercase text-muted">
                  <th className="py-2 pr-3 font-semibold">{tx("Koha", "Time")}</th>
                  <th className="py-2 pr-3 font-semibold">{tx("Aktori", "Actor")}</th>
                  <th className="py-2 pr-3 font-semibold">{tx("Veprimi", "Action")}</th>
                  <th className="py-2 pr-3 font-semibold">{tx("Entiteti", "Entity")}</th>
                  <th className="py-2 font-semibold">{tx("Përmbledhja", "Summary")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70 last:border-0 align-top">
                    <td className="whitespace-nowrap py-2.5 pr-3 text-2xs text-muted">{formatDateTime(row.createdAt, locale)}</td>
                    <td className="py-2.5 pr-3">
                      <span className="block text-2xs font-medium text-ink">{row.actorEmail}</span>
                      <span className="block font-mono text-2xs text-muted">{row.actorId.slice(0, 8)}</span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-2xs text-forest-800">{row.action}</td>
                    <td className="py-2.5 pr-3 text-2xs">
                      <span className="block">{row.entityType}</span>
                      <span className="block break-all font-mono text-muted">{row.entityId.slice(0, 18)}</span>
                    </td>
                    <td className="py-2.5 text-[12px] leading-5 text-ink/80">
                      {row.summary}
                      {row.metadata && (
                        <span className="mt-0.5 block break-words font-mono text-2xs text-muted">
                          {Object.entries(row.metadata)
                            .map(([key, value]) => `${key}=${String(value)}`)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
