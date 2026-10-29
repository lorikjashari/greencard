import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileCheck2 } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { hasPermission } from "@/lib/status/transitions";
import { listApplications } from "@/lib/repo/applications";
import { listFilings } from "@/lib/repo/filings";
import { getActiveDvYear, isWindowOpen } from "@/lib/repo/dv-years";
import { formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, AdminNotice, StatCard, StatStrip } from "@/components/admin/ui";
import { recordFilingAction, sendConfirmationAction } from "@/app/admin/actions";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Filing centre" };
export const dynamic = "force-dynamic";

const RELEVANT: ApplicationStatus[] = ["ready_to_file", "filed", "confirmation_sent"];

export default async function FilingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; error?: string }>;
}) {
  const staff = await requireAdminPage("filing.file");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { status, notice, error } = await searchParams;

  const [applications, filings, dvYear] = await Promise.all([
    listApplications({ status: RELEVANT }),
    listFilings(),
    getActiveDvYear(),
  ]);
  const filingByApp = new Map(filings.map((filing) => [filing.applicationId, filing]));
  const canSendConfirmation = hasPermission(staff.role, "filing.file");
  const open = isWindowOpen(dvYear);

  const filter = status && RELEVANT.includes(status as ApplicationStatus) ? (status as ApplicationStatus) : null;
  const rows = applications
    .filter((application) => (filter ? application.status === filter : true))
    .sort((a, b) => a.ref.localeCompare(b.ref));

  const count = (value: ApplicationStatus) => applications.filter((application) => application.status === value).length;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.filing}
        description={tx(
          "Vetëm rastet me pagesë të konfirmuar. Numri i konfirmimit regjistrohet vetëm pas dorëzimit real në faqen zyrtare.",
          "Only cases with confirmed payment. The confirmation number is recorded only after a real filing on the official site.",
        )}
        actions={
          <Link href="/admin/dv-years" className="btn-secondary btn-sm">
            DV {dvYear.year}
          </Link>
        }
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      {!open && (
        <div className="mt-4 flex items-start gap-2 border border-warning/50 bg-warning-50 p-3.5 text-[13px] leading-6 text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {tx(
              `Sipas konfigurimit, dritarja zyrtare për DV ${dvYear.year} nuk është e hapur (${formatDate(dvYear.opensAt, locale)} – ${formatDate(dvYear.closesAt, locale)}). Verifiko datat zyrtare përpara çdo dorëzimi; konfigurimi nuk zëvendëson udhëzimet zyrtare.`,
              `According to configuration, the official DV ${dvYear.year} window is not open (${formatDate(dvYear.opensAt, locale)} – ${formatDate(dvYear.closesAt, locale)}). Verify official dates before any filing; configuration does not replace official instructions.`,
            )}
          </span>
        </div>
      )}

      <StatStrip>
        <StatCard label={t.status.ready_to_file} value={count("ready_to_file")} detail={tx("Pagesa e konfirmuar", "Payment confirmed")} tone={count("ready_to_file") > 0 ? "success" : "default"} />
        <StatCard label={t.status.filed} value={count("filed")} detail={tx("Konfirmim i regjistruar", "Confirmation recorded")} />
        <StatCard label={t.status.confirmation_sent} value={count("confirmation_sent")} detail={tx("Njoftuar klientit", "Client notified")} />
      </StatStrip>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Link href="/admin/filing" className={`chip ${!filter ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}>
          {t.common.all}
        </Link>
        {RELEVANT.map((value) => (
          <Link
            key={value}
            href={`/admin/filing?status=${value}`}
            className={`chip ${filter === value ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}
          >
            {t.status[value]} <span className="font-semibold">{count(value)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {rows.length === 0 ? (
          <div className="border border-line bg-paper p-4">
            <AdminEmpty text={tx("Nuk ka raste në këtë filtër.", "No cases in this filter.")} />
          </div>
        ) : (
          rows.map((application) => {
            const filing = filingByApp.get(application.id);
            return (
              <article key={application.id} className="border border-line bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/applications/${application.id}`} className="font-mono text-xs font-semibold text-forest-800 hover:text-clay-600 hover:underline">
                        {application.ref}
                      </Link>
                      <Link
                        href={`/admin/filing/${application.id}`}
                        className="text-2xs font-semibold text-forest-800 underline underline-offset-2"
                      >
                        {tx("Hapësira e dorëzimit", "Filing workspace")}
                      </Link>
                      <StatusBadge kind="application" value={application.status} t={t} />
                      <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-ink">
                      {application.applicant.firstName} {application.applicant.lastName}
                    </p>
                    <p className="text-2xs text-muted">
                      DV {application.dvYear} · {application.packageKey} · {formatDate(application.submittedAt, locale)}
                    </p>
                  </div>

                  {filing ? (
                    <div className="border border-forest-300 bg-forest-50/60 px-3 py-2 text-right">
                      <p className="flex items-center justify-end gap-1 text-2xs font-semibold uppercase tracking-wide text-forest-700">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {t.account.confirmationNumber}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-forest-800">{filing.confirmationNumber}</p>
                      <p className="text-2xs text-forest-700/80">{formatDateTime(filing.filedAt, locale)}</p>
                    </div>
                  ) : (
                    <span className="chip border-warning/40 bg-warning-50 text-warning">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {tx("Pa dorëzim", "Not filed")}
                    </span>
                  )}
                </div>

                {!filing && application.status === "ready_to_file" && (
                  <form action={recordFilingAction} className="mt-3 grid gap-2 bg-ivory/50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="redirectTo" value="/admin/filing" />
                    <div>
                      <label className="label" htmlFor={`confirmation-${application.id}`}>
                        {t.account.confirmationNumber}
                      </label>
                      <input
                        id={`confirmation-${application.id}`}
                        name="confirmationNumber"
                        className="field"
                        minLength={6}
                        required
                        autoComplete="off"
                        placeholder={tx("Nga faqja zyrtare", "From the official site")}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`notes-${application.id}`}>
                        {t.common.notes}
                      </label>
                      <input id={`notes-${application.id}`} name="notes" className="field" maxLength={500} />
                    </div>
                    <button type="submit" className="btn-primary btn-sm">
                      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {tx("Regjistro dorëzimin", "Record filing")}
                    </button>
                  </form>
                )}

                {filing && application.status === "filed" && canSendConfirmation && (
                  <form action={sendConfirmationAction} className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="redirectTo" value="/admin/filing" />
                    <button type="submit" className="btn-secondary btn-sm">
                      {tx("Dërgo njoftimin e konfirmimit", "Send confirmation notice")}
                    </button>
                    <span className="text-2xs text-muted">
                      {tx(
                        "Pa email të konfiguruar, shkon në outbox dhe statusi nuk shënohet i dërguar.",
                        "Without email configured, it goes to the outbox and status is not marked sent.",
                      )}
                    </span>
                  </form>
                )}

                {filing && application.status === "confirmation_sent" && (
                  <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-2xs text-forest-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {tx("Klienti u njoftua me numrin e konfirmimit.", "The client was notified with the confirmation number.")}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
