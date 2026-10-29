import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listApplications } from "@/lib/repo/applications";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader, AdminEmpty, AdminNotice, StatCard, StatStrip } from "@/components/admin/ui";
import { photoIssues } from "@/lib/photos";
import { reviewPhotoAction } from "@/app/admin/actions";
import type { PhotoStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Photo review" };
export const dynamic = "force-dynamic";

const PENDING: PhotoStatus[] = ["pending", "valid", "invalid", "rejected"];

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; notice?: string; error?: string }>;
}) {
  await requireAdminPage("photos.review");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { q, status, notice, error } = await searchParams;

  const applications = await listApplications({ query: q?.trim() || undefined });
  const photos = applications.flatMap((application) =>
    application.photos.map((photo) => ({ application, photo })),
  );

  const counts = (value: PhotoStatus) => photos.filter((entry) => entry.photo.status === value).length;
  const photoLabel = (value: PhotoStatus) =>
    value === "pending"
      ? tx("Në pritje", "Pending")
      : value === "valid"
        ? tx("Teknikisht e vlefshme", "Technically valid")
        : value === "invalid"
          ? tx("E pavlefshme", "Invalid")
          : value === "approved"
            ? t.apply.photoApproved
            : t.apply.photoRejected;
  const filter = status && PENDING.includes(status as PhotoStatus) ? (status as PhotoStatus) : null;
  const rows = photos
    .filter((entry) => (filter ? entry.photo.status === filter : PENDING.includes(entry.photo.status)))
    .sort((a, b) => {
      const rank = (value: PhotoStatus) =>
        value === "invalid" ? 0 : value === "rejected" ? 1 : value === "pending" ? 2 : value === "valid" ? 3 : 4;
      const diff = rank(a.photo.status) - rank(b.photo.status);
      return diff !== 0 ? diff : b.photo.uploadedAt.localeCompare(a.photo.uploadedAt);
    });

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.photos}
        description={tx(
          "Kontrollo fotografitë kundrejt rregullave zyrtare. Kontrolli automatik është vetëm këshillues; vendimi është i stafit.",
          "Check photos against the official rules. The automated check is advisory only; staff make the decision.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <StatStrip>
        <StatCard label={tx("Në pritje", "Pending")} value={counts("pending") + counts("valid")} detail={tx("Të pakontrolluara", "Not yet reviewed")} tone="warning" />
        <StatCard label={tx("Të pavlefshme", "Invalid")} value={counts("invalid")} detail={tx("Gabime teknike", "Technical errors")} tone={counts("invalid") > 0 ? "danger" : "default"} />
        <StatCard label={t.apply.photoRejected} value={counts("rejected")} detail={tx("Refuzuar nga stafi", "Rejected by staff")} />
        <StatCard label={t.apply.photoApproved} value={counts("approved")} detail={tx("Gati për dorëzim", "Ready for filing")} tone="success" />
      </StatStrip>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/admin/photos" className={`chip ${!filter ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}>
            {tx("Në pritje", "Pending")}
          </Link>
          {(["invalid", "rejected", "approved"] as PhotoStatus[]).map((value) => (
            <Link
              key={value}
              href={`/admin/photos?status=${value}`}
              className={`chip ${filter === value ? "border-forest-200 bg-forest-50 text-forest-800" : "border-line bg-paper text-muted"}`}
            >
              {photoLabel(value)}
            </Link>
          ))}
        </div>

        <form method="get" className="flex items-center gap-2">
          {filter && <input type="hidden" name="status" value={filter} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q ?? ""}
              className="field w-56 pl-8"
              placeholder={tx("Referenca ose emri", "Reference or name")}
              aria-label={t.common.search}
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm">
            {t.common.search}
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 border border-line bg-paper p-4">
          <AdminEmpty text={tx("Nuk ka foto në këtë filtër.", "No photos in this filter.")} />
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ application, photo }) => (
            <li key={photo.id} className="border border-line bg-paper p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/applications/${application.id}`}
                    className="font-mono text-2xs font-semibold text-forest-800 hover:text-clay-600 hover:underline"
                  >
                    {application.ref}
                  </Link>
                  <p className="truncate text-[12.5px] font-medium text-ink">{photo.memberName}</p>
                  <p className="text-2xs text-muted">
                    {photo.width}×{photo.height} · {Math.round(photo.bytes / 1024)} KB · {formatDateTime(photo.uploadedAt, locale)}
                  </p>
                </div>
                <StatusBadge kind="photo" value={photo.status} t={t} />
              </div>

              <div className="mt-2 aspect-square overflow-hidden rounded bg-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${photo.storageKey}`}
                  alt={`${photo.memberName} — ${application.ref}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {photoIssues(photo).length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {photoIssues(photo).map((issue) => (
                    <li
                      key={issue.code}
                      className={`flex items-start gap-1 text-2xs leading-4 ${
                        issue.severity === "error" ? "text-danger" : "text-warning"
                      }`}
                    >
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      {locale === "sq" ? issue.messageSq : issue.messageEn}
                    </li>
                  ))}
                </ul>
              )}

              {photo.reviewedAt && (
                <p className="mt-1.5 text-2xs text-muted">
                  {photo.reviewedBy} · {formatDateTime(photo.reviewedAt, locale)}
                  {photo.reviewNote ? ` · ${photo.reviewNote}` : ""}
                </p>
              )}

              <form action={reviewPhotoAction} className="mt-2 space-y-1.5 border-t border-line pt-2">
                <input type="hidden" name="applicationId" value={application.id} />
                <input type="hidden" name="photoId" value={photo.id} />
                <input type="hidden" name="redirectTo" value="/admin/photos" />
                <input
                  name="note"
                  className="field px-2 py-1 text-2xs"
                  maxLength={500}
                  placeholder={tx("Shënim (i detyrueshëm për refuzim)", "Note (required for rejection)")}
                  aria-label={tx("Shënim për foton", "Photo note")}
                />
                <div className="flex gap-1.5">
                  <button type="submit" name="decision" value="approve" className="btn-primary btn-sm flex-1">
                    {t.apply.photoApproved}
                  </button>
                  <button type="submit" name="decision" value="reject" className="btn-secondary btn-sm flex-1">
                    {t.apply.photoRejected}
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
