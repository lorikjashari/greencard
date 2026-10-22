import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { getPublicConfig } from "@/lib/config";
import { ensureDemoSeed, DEMO_ACCOUNTS } from "@/lib/demo/seed";
import { copy } from "@/messages/get";
import { adminLocale } from "@/lib/admin/locale";
import { LoginForm } from "@/components/auth/login-form";
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

  return (
    <div className="min-h-dvh bg-forest-950">
      <div className="mx-auto grid min-h-dvh max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_26rem] lg:items-center lg:py-16">
        <div className="text-white">
          <Logo inverted />
          <h1 className="mt-10 font-serif text-4xl tracking-[-0.02em]">{t.auth.adminTitle}</h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/70">{t.auth.adminIntro}</p>

          <ul className="mt-8 space-y-3 text-[13px] text-white/70">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {locale === "sq"
                ? "Roli dhe lejet kontrollohen në server për çdo veprim."
                : "Role and permissions are enforced on the server for every action."}
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {locale === "sq"
                ? "Sesionet e stafit skadojnë pas 8 orësh, me mbyllje pas 30 minutash pasiviteti."
                : "Staff sessions expire after 8 hours, with a 30-minute idle lock."}
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {locale === "sq"
                ? "Të gjitha veprimet e ndjeshme regjistrohen në audit."
                : "All sensitive actions are written to the audit log."}
            </li>
          </ul>

          <Link
            href="/sq"
            className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.legal.backHome}
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white p-6 shadow-2xl">
          {isClient && session ? (
            <div className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">{t.auth.noAccess}</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{session.email}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href={`/${locale}/account`} className="btn-primary btn-sm">
                  {t.nav.account}
                </Link>
                <SignOutButton label={t.common.signOut} redirectTo="/admin/login" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-ink">{t.auth.adminTitle}</h2>
                <span className="chip border-forest-200 bg-forest-50 text-forest-700">STAFF</span>
              </div>

              {warning && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-[12.5px] leading-5 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {warning[locale]}
                </div>
              )}

              <div className="mt-5">
                <LoginForm
                  locale={locale}
                  t={t}
                  demo={config.demo}
                  demoAccounts={config.demo ? DEMO_ACCOUNTS.filter((account) => account.role !== "client") : []}
                  firebaseMode={!config.demo}
                  initialError={error === "inactive" ? "inactive" : undefined}
                />
              </div>

              <p className="mt-5 border-t border-line pt-4 text-2xs leading-5 text-muted">
                {t.auth.adminIntro}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
