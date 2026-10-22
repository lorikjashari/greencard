import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Inbox } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { emailConfigured } from "@/lib/config";
import { listNotifications, listOutbox } from "@/lib/notifications/service";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminEmpty, AdminNotice, StatCard } from "@/components/admin/ui";
import { retryEmailAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Email outbox" };
export const dynamic = "force-dynamic";

export default async function OutboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; error?: string }>;
}) {
  await requireAdminPage("settings.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { status, notice, error } = await searchParams;

  const [notifications, outbox] = await Promise.all([listNotifications(), listOutbox()]);
  const bodies = new Map(outbox.map((entry) => [entry.notificationId, entry]));
  const configured = emailConfigured();

  const statuses = ["queued", "sent", "failed", "not_configured"] as const;
  const filtered = status ? notifications.filter((notification) => notification.status === status) : notifications;
  const count = (value: (typeof statuses)[number]) =>
    notifications.filter((notification) => notification.status === value).length;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.outbox}
        description={tx(
          "Njoftimet me email dhe arkivi i përmbajtjes. Kur ofruesi nuk është konfiguruar, mesazhi ruhet këtu dhe NUK raportohet si i dërguar.",
          "Email notifications and the content archive. When no provider is configured, the message is stored here and is NOT reported as sent.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      {!configured && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-[13px] leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {tx(
              "EMAIL_PROVIDER/RESEND_API_KEY/EMAIL_FROM nuk janë konfiguruar. Asnjë email nuk dërgohet; të gjitha mesazhet mbeten në outbox. Për të testuar rrjedhën, përdor lidhjet demo ose lexo përmbajtjen këtu.",
              "EMAIL_PROVIDER/RESEND_API_KEY/EMAIL_FROM are not configured. No email is delivered; all messages remain in the outbox. To test the flow, use demo links or read the content here.",
            )}
          </span>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatCard label={tx("Në pritje", "Queued")} value={count("queued")} tone={count("queued") > 0 ? "warning" : "default"} />
        <StatCard label={tx("Dërguar", "Sent")} value={count("sent")} tone="success" />
        <StatCard label={tx("Dështuar", "Failed")} value={count("failed")} tone={count("failed") > 0 ? "danger" : "default"} />
        <StatCard label={tx("Pa konfigurim", "Not configured")} value={count("not_configured")} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Link href="/admin/outbox" className={`chip ${!status ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-white text-muted"}`}>
          {t.common.all}
        </Link>
        {statuses.map((value) => (
          <Link
            key={value}
            href={`/admin/outbox?status=${value}`}
            className={`chip ${status === value ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-white text-muted"}`}
          >
            {value} <span className="font-semibold">{count(value)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-white p-4">
            <AdminEmpty text={tx("Nuk ka njoftime në këtë filtër.", "No notifications in this filter.")} />
          </div>
        ) : (
          filtered.map((notification) => {
            const body = bodies.get(notification.id);
            return (
              <article key={notification.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{notification.subject}</p>
                    <p className="truncate text-2xs text-muted">
                      {notification.type} · {notification.to} · {formatDateTime(notification.createdAt, locale)}
                    </p>
                  </div>
                  <span
                    className={`chip ${
                      notification.status === "sent"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : notification.status === "failed"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {notification.status}
                  </span>
                </div>

                {notification.error && (
                  <p className="mt-2 rounded bg-ivory px-2 py-1 text-2xs text-muted">{notification.error}</p>
                )}

                <details className="mt-2 text-2xs">
                  <summary className="cursor-pointer font-medium text-forest">
                    {tx("Shiko përmbajtjen", "View content")}
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-ivory p-3 leading-5 text-ink/80">
                    {body?.text ?? notification.bodyPreview}
                  </pre>
                </details>

                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2">
                  {notification.applicationId && (
                    <Link
                      href={`/admin/applications/${notification.applicationId}`}
                      className="inline-flex items-center gap-1 text-2xs font-semibold text-forest hover:underline"
                    >
                      <Inbox className="h-3 w-3" aria-hidden="true" />
                      {t.common.details}
                    </Link>
                  )}
                  {configured && notification.status !== "sent" && (
                    <form action={retryEmailAction}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <input type="hidden" name="redirectTo" value="/admin/outbox" />
                      <button type="submit" className="btn-secondary btn-sm">
                        {t.common.retry}
                      </button>
                    </form>
                  )}
                  <span className="font-mono text-2xs text-muted">{notification.provider}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
