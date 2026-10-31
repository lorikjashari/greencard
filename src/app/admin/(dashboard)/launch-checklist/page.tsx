import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MinusCircle, Settings } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { auditProductionReadiness, getAppMode } from "@/lib/config";
import { getSettings } from "@/lib/repo/settings";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import { formatDate } from "@/lib/format";
import { AdminPageHeader, SectionCard } from "@/components/admin/ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await adminLocale();
  return { title: locale === "sq" ? "Lista e nisjes" : "Launch checklist" };
}
export const dynamic = "force-dynamic";

export default async function LaunchChecklistPage() {
  await requireAdminPage("settings.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);

  const checks = auditProductionReadiness();
  const settings = await getSettings();
  const dvYear = await getActiveDvYear();
  const mode = getAppMode();

  const businessDecisions = [
    {
      key: "post-selection-fee",
      done: settings.postSelectionFeeEnabled !== null,
      title: tx("Tarifa pas përzgjedhjes (750 €)", "Post-selection fee (€750)"),
      detail: tx(
        "Vendim biznesi i pazgjidhur. Aktualisht nuk aplikohet. Çdo tarifë e ardhshme kërkon informim dhe pranim të veçantë.",
        "Unresolved business decision. It is not currently applied. Any future fee requires separate disclosure and acceptance.",
      ),
    },
    {
      key: "single-parent",
      done: settings.singleParentPricingApproved,
      title: tx("Çmimi për prind të vetëm", "Single-parent pricing"),
      detail: tx(
        "Nuk ka politikë të miratuar për rastet me një prind. Pa miratim, rastet shqyrtohen manualisht.",
        "No approved policy for single-parent cases. Without approval, cases are reviewed manually.",
      ),
    },
    {
      key: "spouse-exclusion",
      done: settings.spouseExclusionPricingApproved,
      title: tx("Përjashtimi i bashkëshortit", "Spouse exclusion"),
      detail: tx(
        "Përjashtimet ligjore (p.sh. shtetësi amerikane, ndarje e dokumentuar) kërkojnë verifikim dhe politikë çmimi.",
        "Legal exclusions (for example US citizenship, documented separation) require verification and a pricing policy.",
      ),
    },
    {
      key: "retention",
      done: settings.retentionApproved,
      title: tx("Ruajtja e të dhënave", "Data retention"),
      detail: tx(
        "Afatet e propozuara në kod nuk janë miratuar. Mos i paraqit si politikë finale.",
        "The proposed periods in code are not approved. Do not present them as final policy.",
      ),
    },
    {
      key: "legal",
      done: settings.legalCopyApproved,
      title: tx("Teksti ligjor", "Legal copy"),
      detail: tx(
        "Faqet ligjore janë draft me shënim të qartë. Kërkohet rishikim ligjor për Kushtet, Privatësinë dhe rimbursimet.",
        "Legal pages are drafts with a clear notice. Legal review is required for Terms, Privacy and refunds.",
      ),
    },
    {
      key: "stripe-kosovo",
      done: false,
      title: tx("Pagesa me kartë / PSP", "Card payments / PSP"),
      detail: tx(
        "Stripe nuk mbështet bizneset me seli në Kosovë. Zgjidh një PSP ose llogari të përshtatshme; deri atëherë kartela mbetet e çaktivizuar.",
        "Stripe does not support Kosovo-based merchants. Choose a PSP or suitable account; until then card payment stays disabled.",
      ),
    },
    {
      key: "mfa",
      done: false,
      title: tx("MFA për stafin", "Staff MFA"),
      detail: tx(
        "Nuk është implementuar. Kërkohet para lansimit për llogaritë e stafit që shohin të dhëna personale.",
        "Not implemented. Required before launch for staff accounts that access personal data.",
      ),
    },
    {
      key: "dv-dates",
      done: false,
      title: tx(`Datat zyrtare DV ${dvYear.year}`, `Official DV ${dvYear.year} dates`),
      detail: tx(
        `Konfigurimi aktual: ${formatDate(dvYear.opensAt, locale)} – ${formatDate(dvYear.closesAt, locale)}. Verifiko me udhëzimet zyrtare përpara hapjes.`,
        `Current configuration: ${formatDate(dvYear.opensAt, locale)} – ${formatDate(dvYear.closesAt, locale)}. Verify against official instructions before opening.`,
      ),
    },
    {
      key: "cash-mechanics",
      done: false,
      title: tx("Mekanika e pagesës cash", "Cash mechanics"),
      detail: tx(
        "Vendndodhja, posta, përgjegjësia për humbje dhe skadimi i pagesës duhet të miratohen dhe të pasqyrohen në udhëzime.",
        "Location, post, loss liability and payment expiry must be approved and reflected in the instructions.",
      ),
    },
  ];

  const openBusiness = businessDecisions.filter((decision) => !decision.done).length;
  const failedChecks = checks.filter((check) => !check.ok).length;

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.launchChecklist}
        description={tx(
          "Gjendja reale e sistemit dhe bllokuesit e lansimit. Kjo faqe nuk shënon asgjë si gati pa provë.",
          "The real state of the system and launch blockers. This page never marks anything ready without evidence.",
        )}
        actions={
          <Link href="/admin/settings" className="btn-secondary btn-sm">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            {t.admin.nav.settings}
          </Link>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border border-line bg-paper p-4">
          <p className="eyebrow-muted text-[10px]">{tx("Modaliteti", "Mode")}</p>
          <p className="mt-1.5 font-serif text-2xl text-forest-900">{mode}</p>
          <p className="mt-1 text-2xs text-muted">
            {mode === "demo"
              ? tx("Të dhëna lokale; email nuk dërgohet.", "Local data; email is not delivered.")
              : tx("Backend Neon Postgres i konfiguruar.", "Neon Postgres backend configured.")}
          </p>
        </div>
        <div className={`border p-4 ${failedChecks > 0 ? "border-l-2 border-warning bg-warning-50/40" : "border-l-2 border-forest-400 bg-forest-50/60"}`}>
          <p className="eyebrow-muted text-[10px]">{tx("Kontrollat teknike", "Technical checks")}</p>
          <p className="mt-1.5 font-serif text-2xl text-forest-900">
            {checks.length - failedChecks}/{checks.length}
          </p>
          <p className="mt-1 text-2xs text-muted">{tx("Konfigurim i verifikuar automatikisht", "Automatically verified configuration")}</p>
        </div>
        <div className={`border p-4 ${openBusiness > 0 ? "border-l-2 border-warning bg-warning-50/40" : "border-l-2 border-forest-400 bg-forest-50/60"}`}>
          <p className="eyebrow-muted text-[10px]">{tx("Vendime biznesi", "Business decisions")}</p>
          <p className="mt-1.5 font-serif text-2xl text-forest-900">{openBusiness}</p>
          <p className="mt-1 text-2xs text-muted">{tx("Të pazgjidhura / pa miratim", "Unresolved / unapproved")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title={tx("Konfigurimi teknik", "Technical configuration")}
          description={tx("Nuk shfaqen vlera sekrete — vetëm nëse janë vendosur.", "No secret values are shown — only whether they are set.")}
        >
          <ul className="space-y-2.5">
            {checks.map((check) => (
              <li key={check.key} className="flex items-start gap-2 text-[12.5px]">
                {check.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                ) : (
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                )}
                <span>
                  <span className="font-medium text-ink">{check.key}</span>
                  <span className={`ml-1.5 rounded px-1.5 py-0.5 text-2xs ${check.ok ? "bg-forest-50 text-forest-700" : "bg-warning-50 text-warning"}`}>
                    {check.ok ? tx("konfiguruar", "configured") : tx("mungon", "missing")}
                  </span>
                  <span className="mt-0.5 block text-2xs leading-5 text-muted">
                    {check.ok ? tx("Konfiguruar dhe i verifikueshëm në mjedis.", "Configured and verifiable in the environment.") : check.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-2 text-2xs leading-5 text-muted">
            {tx(
              "Përveç kësaj, para lansimit: rezervime/backup, monitorim, kufizim i normës në shumë instanca, rishikim i marrëveshjeve me ofruesit dhe testim i rikuperimit.",
              "Also before launch: backups, monitoring, multi-instance rate limiting, provider agreement review and recovery testing.",
            )}
          </p>
        </SectionCard>

        <SectionCard
          title={tx("Bllokuesit e biznesit dhe ligjit", "Business and legal blockers")}
          description={tx("Këto kërkojnë vendim njerëzor, jo kod.", "These require a human decision, not code.")}
        >
          <ul className="space-y-3">
            {businessDecisions.map((decision) => (
              <li key={decision.key} className="flex items-start gap-2">
                {decision.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                )}
                <span>
                  <span className="text-[12.5px] font-medium text-ink">{decision.title}</span>
                  <span className={`ml-1.5 rounded px-1.5 py-0.5 text-2xs ${decision.done ? "bg-forest-50 text-forest-700" : "bg-warning-50 text-warning"}`}>
                    {decision.done ? tx("miratuar", "approved") : tx("bllokues", "blocker")}
                  </span>
                  <span className="mt-0.5 block text-2xs leading-5 text-muted">{decision.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-5 flex items-start gap-2 border border-warning/50 bg-warning-50 p-4 text-[13px] leading-6 text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {tx(
            "Statusi i përgjithshëm: NUK është gati për lansim publik derisa të zgjidhen bllokuesit e mësipërm dhe të konfigurohen kredencialet. Demo është i përdorshëm për vlerësim, por nuk dërgon email, nuk pranon kartë dhe nuk dorëzon aplikime në faqen zyrtare.",
            "Overall status: NOT ready for public launch until the blockers above are resolved and credentials are configured. Demo is usable for evaluation, but sends no email, accepts no cards and files nothing on the official site.",
          )}
        </span>
      </div>
    </div>
  );
}
