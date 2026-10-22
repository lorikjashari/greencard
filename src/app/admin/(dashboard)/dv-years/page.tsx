import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listDvYears } from "@/lib/repo/dv-years";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminNotice, SectionCard } from "@/components/admin/ui";
import { saveDvYearAction, activateDvYearAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "DV years" };
export const dynamic = "force-dynamic";

export default async function DvYearsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; notice?: string; error?: string }>;
}) {
  await requireAdminPage("dv.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { year, notice, error } = await searchParams;

  const years = await listDvYears();
  const active = years.find((row) => row.active) ?? years[0];
  const selected = years.find((row) => String(row.year) === year) ?? active;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.dvYears}
        description={tx(
          "Konfigurimi i vitit DV, dritares dhe rregullave të fotos. Datat duhet të verifikohen gjithmonë me udhëzimet zyrtare.",
          "DV year, window and photo-rules configuration. Dates must always be verified against the official instructions.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-[13px] leading-6 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {tx(
            "Ky konfigurim nuk zëvendëson udhëzimet zyrtare. Mos hap shitje ose dorëzim pa konfirmuar datat, shtetin e pranueshëm dhe rregullat e fotos për vitin përkatës.",
            "This configuration does not replace official instructions. Do not open sales or filing without confirming the dates, eligible countries and photo rules for the relevant year.",
          )}
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title={tx("Vitet e konfiguruara", "Configured years")}>
          <ul className="space-y-3">
            {years.map((row) => (
              <li key={row.id} className="rounded-md border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg text-forest-900">DV {row.year}</p>
                    {row.active ? (
                      <span className="chip border-emerald-200 bg-emerald-50 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {tx("Aktiv", "Active")}
                      </span>
                    ) : (
                      <span className="chip border-line bg-ivory text-muted">{tx("Pasiv", "Inactive")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/dv-years?year=${row.year}`} className="text-2xs font-semibold text-forest hover:underline">
                      {t.common.edit}
                    </Link>
                    {!row.active && (
                      <form action={activateDvYearAction}>
                        <input type="hidden" name="year" value={row.year} />
                        <button type="submit" className="btn-secondary btn-sm">
                          {tx("Aktivizo", "Activate")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <dl className="mt-2 grid gap-1.5 text-2xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">{tx("Hapja", "Opens")}</dt>
                    <dd>{formatDateTime(row.opensAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{tx("Mbyllja", "Closes")}</dt>
                    <dd>{formatDateTime(row.closesAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{tx("Rregullat e fotos", "Photo rules")}</dt>
                    <dd>{row.photoRulesVersion}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{tx("Përditësuar", "Updated")}</dt>
                    <dd>
                      {formatDateTime(row.updatedAt, locale)} · {row.updatedBy}
                    </dd>
                  </div>
                </dl>
                <a
                  href={row.instructionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1 text-2xs text-forest hover:underline"
                >
                  {tx("Udhëzimet zyrtare", "Official instructions")}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                {row.notes && <p className="mt-1.5 text-2xs leading-5 text-muted">{row.notes}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title={selected ? `${t.common.edit}: DV ${selected.year}` : tx("Shto vit", "Add year")}
          description={tx("Ruajtja e një viti të ri nuk e aktivizon automatikisht.", "Saving a new year does not activate it automatically.")}
        >
          <form action={saveDvYearAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="year">
                  {tx("Viti", "Year")}
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="2020"
                  max="2100"
                  defaultValue={selected?.year ?? 2027}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="photoRulesVersion">
                  {tx("Versioni i rregullave të fotos", "Photo rules version")}
                </label>
                <input
                  id="photoRulesVersion"
                  name="photoRulesVersion"
                  defaultValue={selected?.photoRulesVersion ?? ""}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="opensAt">
                  {tx("Hapja", "Opens")}
                </label>
                <input
                  id="opensAt"
                  name="opensAt"
                  type="datetime-local"
                  defaultValue={selected ? selected.opensAt.slice(0, 16) : ""}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="closesAt">
                  {tx("Mbyllja", "Closes")}
                </label>
                <input
                  id="closesAt"
                  name="closesAt"
                  type="datetime-local"
                  defaultValue={selected ? selected.closesAt.slice(0, 16) : ""}
                  className="field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="instructionsUrl">
                {tx("Lidhja zyrtare", "Official URL")}
              </label>
              <input
                id="instructionsUrl"
                name="instructionsUrl"
                type="url"
                defaultValue={selected?.instructionsUrl ?? "https://dvprogram.state.gov/"}
                className="field"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="notes">
                {t.common.notes}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={selected?.notes ?? ""}
                className="field"
                maxLength={1000}
              />
            </div>

            <label className="inline-flex items-center gap-2 text-[12.5px] text-ink">
              <input type="checkbox" name="activate" className="h-4 w-4" defaultChecked={selected?.active} />
              {tx("Aktivizo këtë vit pas ruajtjes", "Activate this year after saving")}
            </label>

            <button type="submit" className="btn-primary btn-sm">
              {t.common.save}
            </button>
            <p className="text-2xs leading-5 text-muted">
              {tx(
                "Vetëm një vit mund të jetë aktiv. Formulari i aplikimit përdor vitin aktiv dhe rregullat e tij.",
                "Only one year can be active. The public form uses the active year and its rules.",
              )}
            </p>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
