import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listDataRequests, listEditRequests } from "@/lib/repo/requests";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminEmpty, AdminNotice, SectionCard, StatCard } from "@/components/admin/ui";
import { updateDataRequestAction, resolveEditRequestAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Data requests" };
export const dynamic = "force-dynamic";

const STATUSES = ["open", "in_progress", "completed", "declined"] as const;

export default async function DataRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdminPage("data_requests.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { notice, error } = await searchParams;

  const [requests, edits] = await Promise.all([listDataRequests(), listEditRequests()]);
  const openEdits = edits.filter((request) => request.status === "open");

  const count = (status: string) => requests.filter((request) => request.status === status).length;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.dataRequests}
        description={tx(
          "Kërkesat e klientëve për akses, korrigjim ose fshirje, plus kërkesat për ndryshim të aplikimit.",
          "Client requests for access, correction or deletion, plus application change requests.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatCard label={tx("Të hapura", "Open")} value={count("open")} tone={count("open") > 0 ? "warning" : "default"} />
        <StatCard label={tx("Në punë", "In progress")} value={count("in_progress")} />
        <StatCard label={tx("Përfunduar", "Completed")} value={count("completed")} tone="success" />
        <StatCard label={tx("Kërkesa ndryshimi", "Change requests")} value={openEdits.length} tone={openEdits.length > 0 ? "warning" : "default"} />
      </div>

      <div className="mt-5 space-y-5">
        <SectionCard
          title={tx("Kërkesat për të dhëna", "Data requests")}
          description={tx(
            "Përfundimi i një kërkese regjistron trajtimin; fshirja reale duhet të kryhet sipas procedurës së miratuar të ruajtjes.",
            "Completing a request records handling; actual deletion must follow the approved retention procedure.",
          )}
        >
          {requests.length === 0 ? (
            <AdminEmpty text={tx("Nuk ka kërkesa.", "No requests.")} />
          ) : (
            <ul className="space-y-3">
              {requests.map((request) => (
                <li key={request.id} className="rounded-md border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-ink">
                        {request.type} · {request.email}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted">
                        {formatDateTime(request.createdAt, locale)}
                        {request.applicationId ? ` · ${request.applicationId.slice(0, 8)}` : ""}
                        {request.handledBy ? ` · ${request.handledBy}` : ""}
                      </p>
                    </div>
                    <span className="chip border-line bg-ivory text-muted">{request.status}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-5 text-ink/80">{request.message}</p>
                  {request.notes && (
                    <p className="mt-1.5 rounded bg-ivory px-2 py-1 text-2xs text-muted">{request.notes}</p>
                  )}

                  <form action={updateDataRequestAction} className="mt-2 grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end">
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="redirectTo" value="/admin/data-requests" />
                    <div>
                      <label className="label" htmlFor={`status-${request.id}`}>
                        {t.common.status}
                      </label>
                      <select id={`status-${request.id}`} name="status" defaultValue={request.status} className="field">
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`notes-${request.id}`}>
                        {t.common.notes}
                      </label>
                      <input
                        id={`notes-${request.id}`}
                        name="notes"
                        defaultValue={request.notes ?? ""}
                        className="field"
                        maxLength={2000}
                      />
                    </div>
                    <button type="submit" className="btn-secondary btn-sm">
                      {t.common.save}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={tx("Kërkesat për ndryshim", "Change requests")}
          description={tx(
            "Klientët kërkojnë ndryshime pas dorëzimit. Shqyrtoji në kontekstin e aplikimit përpara se t'i zgjidhësh.",
            "Clients request changes after submission. Review them in the application context before resolving.",
          )}
        >
          {openEdits.length === 0 ? (
            <AdminEmpty text={tx("Nuk ka kërkesa të hapura.", "No open requests.")} />
          ) : (
            <ul className="space-y-3">
              {openEdits.map((request) => (
                <li key={request.id} className="rounded-md border border-line p-3">
                  <p className="text-[12.5px] leading-5 text-ink">{request.message}</p>
                  <p className="mt-1 text-2xs text-muted">
                    {request.applicationId} · {formatDateTime(request.createdAt, locale)}
                  </p>
                  <form action={resolveEditRequestAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="redirectTo" value="/admin/data-requests" />
                    <button type="submit" name="status" value="resolved" className="btn-primary btn-sm">
                      {tx("Zgjidhur", "Resolved")}
                    </button>
                    <button type="submit" name="status" value="declined" className="btn-secondary btn-sm">
                      {tx("Refuzuar", "Declined")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
