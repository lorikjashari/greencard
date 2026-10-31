import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { getPublicConfig } from "@/lib/config";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";
import { LoginForm } from "@/components/auth/login-form";
import { DEMO_ACCOUNTS, ensureDemoSeed } from "@/lib/demo/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hyr",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) redirect("/sq/login");
  const locale: Locale = raw;
  const { error } = await searchParams;

  const session = await getSession();
  if (session) {
    redirect(isStaffRole(session.role) ? "/admin" : `/${locale}/account`);
  }

  const config = getPublicConfig();
  if (config.demo) {
    await ensureDemoSeed();
  }

  const t = copy(locale);

  const benefits = [
    { title: pick(locale, "Statusi në çdo hap", "Status at every step"), body: pick(locale, "Shih saktësisht se ku ndodhet aplikimi: kontroll, pagesë, dorëzim.", "See exactly where the application stands: review, payment, filing.") },
    { title: pick(locale, "Fotot dhe dokumentet", "Photos and documents"), body: pick(locale, "Fotot private të dosjes, të aksesueshme vetëm për ty dhe stafin.", "Your private file photos, accessible only to you and staff.") },
    { title: pick(locale, "Numri i konfirmimit", "Confirmation number"), body: pick(locale, "Regjistrohet në llogari sapo dorëzimi përfundon në faqen zyrtare.", "Recorded in your account as soon as filing completes on the official site.") },
  ];

  return (
    <div className="container-page py-10 lg:py-16">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-forest-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t.legal.backHome}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-clay" aria-hidden="true" />
            <p className="eyebrow">{t.nav.login}</p>
          </div>
          <h1 className="display mt-5 text-[clamp(1.95rem,4.2vw,2.75rem)]">{t.auth.loginTitle}</h1>
          <p className="lede mt-4 max-w-md text-[14.5px]">{t.auth.loginIntro}</p>

          <ol className="mt-9 border-t border-line">
            {benefits.map((item, index) => (
              <li key={item.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 border-b border-line py-4">
                <span className="font-serif text-[22px] leading-none tabular text-line-strong" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/apply`}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-ink/70 transition-colors hover:text-forest-800"
            >
              {t.auth.resumeTitle}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="border border-line-strong bg-paper p-6 sm:p-7">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="font-serif text-[19px] leading-none text-forest-900">{t.auth.loginTitle}</h2>
            <span className="stamp border-line-strong text-muted">Client</span>
          </div>

          <div className="mt-5">
            <LoginForm
              locale={locale}
              t={t}
              demo={config.demo}
              demoAccounts={config.demo ? DEMO_ACCOUNTS : []}
              initialError={error}
            />
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[11px] leading-5 text-muted">{t.home.faq7A}</p>
            <a
              href={config.dv.instructionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block font-mono text-[10px] uppercase text-forest-700 hover:text-clay-600"
              style={{ letterSpacing: "0.1em" }}
            >
              {t.home.officialLink} ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
