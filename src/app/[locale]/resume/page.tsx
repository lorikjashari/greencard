import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { getPublicConfig } from "@/lib/config";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { DEMO_ACCOUNTS, ensureDemoSeed } from "@/lib/demo/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vazhdo aplikimin",
  robots: { index: false, follow: false },
};

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) redirect("/sq/resume");
  const locale: Locale = raw;

  const session = await getSession();
  if (session) redirect(isStaffRole(session.role) ? "/admin" : `/${locale}/account`);

  const config = getPublicConfig();
  if (config.demo) await ensureDemoSeed();

  const t = copy(locale);

  return (
    <div className="container-page py-12 lg:py-20">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="order-2 lg:order-1">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-forest"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.legal.backHome}
          </Link>

          <div className="mt-6">
            <Logo href={`/${locale}`} />
            <h1 className="mt-8 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
              {t.auth.resumeTitle}
            </h1>
          </div>

          <div className="mt-6 max-w-md">
            <LoginForm
              locale={locale}
              t={t}
              demo={config.demo}
              demoAccounts={config.demo ? DEMO_ACCOUNTS : []}
              firebaseMode={!config.demo}
              intro={t.auth.resumeIntro}
            />
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="rounded-lg border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-forest">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <p className="text-[11px] font-bold uppercase tracking-wide">{t.home.trust4}</p>
            </div>
            <ul className="mt-4 space-y-3 text-[12.5px] leading-5 text-muted">
              <li>{t.apply.emailHelp}</li>
              <li>{t.apply.savedLocally}</li>
              <li>{t.home.footerDisclaimer}</li>
            </ul>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            <Link href={`/${locale}/login`} className="link">
              {t.auth.loginTitle}
            </Link>
          </p>

          {config.demo && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[12px] leading-5 text-amber-900">
              {t.common.demoBanner}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
