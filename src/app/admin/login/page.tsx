import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { getPublicConfig } from "@/lib/config";
import { ensureDemoSeed, DEMO_ACCOUNTS } from "@/lib/demo/seed";
import { copy } from "@/messages/get";
import { adminLocale } from "@/lib/admin/locale";
import { LoginForm } from "@/components/auth/login-form";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  if (session && isStaffRole(session.role)) redirect("/admin");

  const config = getPublicConfig();
  if (config.demo) await ensureDemoSeed();

  const locale = await adminLocale();
  const t = copy(locale);
  const isClient = session?.role === "client";

  const warning =
    error === "idle"
      ? {
          sq: "Sesioni skadoi për shkak të pasivitetit. Hyr përsëri.",
          en: "Your session expired due to inactivity. Sign in again.",
        }
      : error === "forbidden"
        ? {
            sq: "Kjo llogari nuk ka akses stafi.",
            en: "This account does not have staff access.",
          }
        : error === "inactive"
          ? {
              sq: "Llogaria është çaktivizuar ose pret aprovim.",
              en: "The account is deactivated or awaiting approval.",
            }
          : null;

  const facts = [
    locale === "sq"
      ? "Roli dhe lejet kontrollohen në server për çdo veprim."
      : "Role and permissions are enforced on the server for every action.",
    locale === "sq"
      ? "Sesionet e stafit skadojnë pas 8 orësh, me mbyllje pas 30 minutash pasiviteti."
      : "Staff sessions expire after 8 hours, with a 30-minute idle lock.",
    locale === "sq" ? "Të gjitha veprimet e ndjeshme regjistrohen në audit." : "All sensitive actions are written to the audit log.",
  ];

  return (
    <div className="min-h-dvh bg-forest-950 text-paper">
      <div className="mx-auto grid min-h-dvh max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-20 lg:py-16">
        <div>
          <Logo inverted priority />
          <div className="mt-12 flex items-center gap-3">
            <span className="h-px w-8 bg-clay-300" aria-hidden="true" />
            <p className="font-mono text-3xs uppercase text-clay-200" style={{ letterSpacing: "0.2em" }}>
              Administration
            </p>
          </div>
          <h1 className="display mt-4 text-[clamp(2rem,4vw,3rem)] text-paper">{t.auth.adminTitle}</h1>
          <p className="mt-4 max-w-md text-[14px] leading-7 text-paper/60">{t.auth.adminIntro}</p>

          <ol className="mt-10 max-w-md border-t border-white/10">
            {facts.map((fact, index) => (
              <li key={fact} className="flex items-start gap-4 border-b border-white/10 py-3.5">
                <span className="mt-0.5 font-mono text-3xs tabular text-clay-200" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[12.5px] leading-6 text-paper/70">{fact}</span>
              </li>
            ))}
          </ol>

          <Link
            href="/sq"
            className="mt-8 inline-flex items-center gap-1.5 font-mono text-3xs uppercase text-paper/45 transition-colors hover:text-paper"
            style={{ letterSpacing: "0.12em" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.legal.backHome}
          </Link>
        </div>

        <div className="border border-white/15 bg-paper p-6 text-ink sm:p-7">
          {isClient && session ? (
            <div>
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-semibold text-ink">{t.auth.noAccess}</p>
              <p className="mt-1.5 font-mono text-[11px] text-muted">{session.email}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href={`/${locale}/account`} className="btn-primary btn-sm w-full">
                  {t.nav.account}
                </Link>
                <SignOutButton label={t.common.signOut} redirectTo="/admin/login" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
                <h2 className="font-serif text-[19px] leading-none text-forest-900">{t.auth.adminTitle}</h2>
                <span className="stamp border-forest-300 text-forest-700">Staff</span>
              </div>

              {warning && (
                <div className="mt-4 flex items-start gap-2 border-l-2 border-warning bg-warning-50 px-3.5 py-2.5 text-[12px] leading-5 text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {warning[locale]}
                </div>
              )}

              <div className="mt-5">
                {config.demo ? (
                  <LoginForm
                    locale={locale}
                    t={t}
                    demo
                    demoAccounts={DEMO_ACCOUNTS.filter((account) => account.role !== "client")}
                    initialError={error === "inactive" ? "inactive" : undefined}
                  />
                ) : (
                  <StaffLoginForm locale={locale} t={t} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
