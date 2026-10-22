import type { Metadata } from "next";
import { AlertTriangle, Info } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { getSettings } from "@/lib/repo/settings";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminNotice, SectionCard } from "@/components/admin/ui";
import { saveSettingsAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdminPage("settings.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { notice, error } = await searchParams;

  const settings = await getSettings();
  const feeMode =
    settings.postSelectionFeeEnabled === null
      ? "unresolved"
      : settings.postSelectionFeeEnabled
        ? "enabled"
        : "disabled";

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.settings}
        description={tx(
          "Çmimet, udhëzimet e pagesës dhe flamujt e politikave. Ndryshimet zbatohen për aplikimet e reja dhe ruhen me audit.",
          "Prices, payment instructions and policy flags. Changes apply to new applications and are audit-logged.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <form action={saveSettingsAction} className="mt-5 space-y-5">
        <input type="hidden" name="redirectTo" value="/admin/settings" />

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard
            title={tx("Çmimet", "Prices")}
            description={tx(
              "Çmimi përcaktohet nga përbërja e familjes në server. Ndryshimi nuk rishkruan porositë ekzistuese.",
              "The server derives the price from household composition. Changing it does not rewrite existing orders.",
            )}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="priceIndividual">
                  {t.common.pkgIndividual}
                </label>
                <input
                  id="priceIndividual"
                  name="priceIndividual"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={(settings.prices.individual / 100).toFixed(2)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="priceCouple">
                  {t.common.pkgCouple}
                </label>
                <input
                  id="priceCouple"
                  name="priceCouple"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={(settings.prices.couple / 100).toFixed(2)}
                  className="field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="priceFamily">
                  {t.common.pkgFamily}
                </label>
                <input
                  id="priceFamily"
                  name="priceFamily"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={(settings.prices.family / 100).toFixed(2)}
                  className="field"
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="label" htmlFor="pricingRulesVersion">
                {tx("Versioni i rregullave të çmimit", "Pricing rules version")}
              </label>
              <input
                id="pricingRulesVersion"
                name="pricingRulesVersion"
                defaultValue={settings.pricingRulesVersion}
                className="field"
                required
                maxLength={40}
              />
              <p className="mt-1 text-2xs leading-5 text-muted">
                {tx(
                  "Ndrysho versionin kur ndryshon logjika e çmimit, që porositë e vjetra të mbeten të verifikueshme.",
                  "Bump the version when pricing logic changes so old orders remain verifiable.",
                )}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title={tx("Pagesa cash", "Cash payment")}
            description={tx(
              "Vendet {amount}, {ref}, {address}, {phone}, {email} zëvendësohen automatikisht.",
              "Placeholders {amount}, {ref}, {address}, {phone}, {email} are filled automatically.",
            )}
          >
            <div>
              <label className="label" htmlFor="cashDeadlineDays">
                {tx("Afati i pagesës (ditë)", "Payment deadline (days)")}
              </label>
              <input
                id="cashDeadlineDays"
                name="cashDeadlineDays"
                type="number"
                min="1"
                max="60"
                defaultValue={settings.cashDeadlineDays}
                className="field w-28"
                required
              />
            </div>
            <div className="mt-3">
              <label className="label" htmlFor="cashInstructionsSq">
                {tx("Udhëzimet (SQ)", "Instructions (SQ)")}
              </label>
              <textarea
                id="cashInstructionsSq"
                name="cashInstructionsSq"
                rows={4}
                defaultValue={settings.cashInstructionsSq}
                className="field"
                maxLength={1200}
                required
              />
            </div>
            <div className="mt-3">
              <label className="label" htmlFor="cashInstructionsEn">
                {tx("Udhëzimet (EN)", "Instructions (EN)")}
              </label>
              <textarea
                id="cashInstructionsEn"
                name="cashInstructionsEn"
                rows={4}
                defaultValue={settings.cashInstructionsEn}
                className="field"
                maxLength={1200}
                required
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title={tx("Flamujt e politikave", "Policy flags")}
          description={tx(
            "Këto nuk janë dekorative: ato tregojnë vendime biznesi që ende nuk janë miratuar. Mos i aktivizo pa vendim të dokumentuar.",
            "These are not decorative: they mark business decisions that are not approved yet. Do not switch them on without a documented decision.",
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-line p-3">
              <label className="label" htmlFor="postSelectionFee">
                {tx("Tarifa pas përzgjedhjes (750 € e propozuar)", "Post-selection fee (proposed €750)")}
              </label>
              <select id="postSelectionFee" name="postSelectionFee" defaultValue={feeMode} className="field">
                <option value="unresolved">{tx("E pazgjidhur — mos apliko", "Unresolved — do not apply")}</option>
                <option value="enabled">{tx("Aktivizuar (me shumë më poshtë)", "Enabled (with amount below)")}</option>
                <option value="disabled">{tx("E paaktivizuar zyrtarisht", "Officially disabled")}</option>
              </select>
              <div className="mt-2">
                <label className="label" htmlFor="postSelectionFeeCents">
                  {tx("Shuma e tarifës (EUR)", "Fee amount (EUR)")}
                </label>
                <input
                  id="postSelectionFeeCents"
                  name="postSelectionFeeCents"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    settings.postSelectionFeeCents != null
                      ? (settings.postSelectionFeeCents / 100).toFixed(2)
                      : ""
                  }
                  className="field w-40"
                  disabled={feeMode !== "enabled"}
                />
              </div>
            </div>

            <div className="space-y-2.5 rounded-md border border-line p-3 text-[12.5px]">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="singleParentPricingApproved"
                  defaultChecked={settings.singleParentPricingApproved}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {tx("Çmimi për prind të vetëm është miratuar", "Single-parent pricing is approved")}
                  <span className="block text-2xs text-muted">
                    {tx("Pa miratim, rastet shqyrtohen manualisht.", "Without approval, cases are reviewed manually.")}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="spouseExclusionPricingApproved"
                  defaultChecked={settings.spouseExclusionPricingApproved}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {tx("Përjashtimi i bashkëshortit në çmim është miratuar", "Spouse-exclusion pricing is approved")}
                  <span className="block text-2xs text-muted">
                    {tx("Përjashtimet ligjore kërkojnë verifikim dokumentesh.", "Legal exclusions require document verification.")}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="retentionApproved"
                  defaultChecked={settings.retentionApproved}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {tx("Politika e ruajtjes së të dhënave është miratuar", "Data retention policy is approved")}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="legalCopyApproved"
                  defaultChecked={settings.legalCopyApproved}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {tx("Teksti ligjor është miratuar", "Legal copy is approved")}
                </span>
              </label>
              <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-2xs leading-5 text-amber-900">
                {tx(
                  "MFA për stafin nuk është aktiv në këtë version. Është bllokues lansimi dhe nuk mund të aktivizohet nga ky ekran.",
                  "Staff MFA is not active in this build. It is a launch blocker and cannot be switched on from this screen.",
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-2xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {tx(
              "Tarifa pas përzgjedhjes, çmimi i prindit të vetëm dhe përjashtimi i bashkëshortit janë vendime biznesi të pazgjidhura. Sistemi nuk i zbaton pa miratim të qartë.",
              "The post-selection fee, single-parent pricing and spouse exclusion are unresolved business decisions. The system does not apply them without explicit approval.",
            )}
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-1.5 text-2xs text-muted">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {tx("Përditësuar", "Updated")}: {formatDateTime(settings.updatedAt, locale)} · {settings.updatedBy}
          </p>
          <button type="submit" className="btn-primary btn-sm">
            {t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}
