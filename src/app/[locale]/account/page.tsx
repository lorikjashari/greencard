import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, FolderOpen, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DataRequestForm } from "@/components/account/data-request-form";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { listApplicationsForEmail } from "@/lib/repo/applications";
import { getOrderForApplication } from "@/lib/repo/orders";
import { getPublicConfig } from "@/lib/config";
import { ensureDemoSeed } from "@/lib/demo/seed";
import { nextActionFor } from "@/lib/client/next-action";
import { formatCurrency, formatDate } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Llogaria ime",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { notice } = await searchParams;
  const t = copy(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  if (isStaffRole(session.role)) redirect("/admin");

  if (getPublicConfig().demo) await ensureDemoSeed();

  const applications = await listApplicationsForEmail(session.email);
  const orders = await Promise.all(applications.map((application) => getOrderForApplication(application.id)));

  return (
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-page py-9">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">{t.account.title}</p>
              <h1 className="display mt-3 text-[clamp(1.8rem,3.6vw,2.5rem)]">
                {t.account.greeting}, {session.name}
              </h1>
              <p className="mt-2 font-mono text-[11px] text-muted">{session.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/apply`}
                className="text-[13px] font-medium text-forest-800 underline decoration-clay/50 decoration-1 underline-offset-4 hover:text-clay-600"
              >
                {t.nav.apply}
              </Link>
              <SignOutButton label={t.common.signOut} redirectTo={`/${locale}`} />
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
          <div className="min-w-0">
            {notice === "data" && (
              <div className="mb-6 flex items-start gap-2 border-l-2 border-forest-300 bg-forest-50 px-4 py-3 text-[13px] text-forest-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t.account.dataRequestBody}
              </div>
            )}

            {applications.length === 0 ? (
              <div className="border border-line bg-paper">
                <EmptyState
                  icon={<FolderOpen className="h-5 w-5" />}
                  title={t.account.noApplications}
                  body={t.account.noApplicationsBody}
                  action={
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                      <Link href={`/${locale}/apply`} className="btn-primary btn-sm">
                        {t.nav.apply}
                      </Link>
                      <Link href={`/${locale}/login`} className="btn-secondary btn-sm">
                        {t.nav.login}
                      </Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between border-b border-line pb-2">
                  <p className="eyebrow-muted text-[10px]">{t.account.application}</p>
                  <p className="font-mono text-[10px] tabular text-muted">{applications.length}</p>
                </div>

                <ul>
                  {applications.map((application, index) => {
                    const order = orders[index];
                    const next = nextActionFor(application, order, locale);
                    const packageLabel =
                      application.packageKey === "individual"
                        ? t.common.pkgIndividual
                        : application.packageKey === "couple"
                          ? t.common.pkgCouple
                          : t.common.pkgFamily;

                    return (
                      <li key={application.id} className="border-b border-line">
                        <Link
                          href={`/${locale}/account/${application.id}`}
                          className="group grid gap-5 py-5 transition-colors hover:bg-paper md:grid-cols-[8rem_minmax(0,1fr)_auto] md:gap-8 md:px-3"
                        >
                          <div>
                            <p className="meta text-[9px]">{t.home.fileNumber}</p>
                            <p className="mt-1.5 font-mono text-[12px] font-medium tracking-wide text-forest-900">
                              {application.ref}
                            </p>
                            <p className="mt-2 font-mono text-[10px] tabular text-muted">DV {application.dvYear}</p>
                          </div>

                          <div className="min-w-0">
                            <h2 className="font-serif text-[21px] leading-tight text-forest-900">{packageLabel}</h2>
                            <p className="mt-1.5 text-[12.5px] text-muted">
                              {formatCurrency(application.amountCents, locale)} ·{" "}
                              {formatDate(application.submittedAt ?? application.createdAt, locale)}
                            </p>
                            <div className="mt-3 border-l-2 border-line-strong pl-3">
                              <p className="eyebrow-muted text-[9px]">{t.account.nextAction}</p>
                              <p className="mt-1 text-[13px] font-medium leading-5 text-ink">{next.title}</p>
                              <p className="mt-0.5 text-[12px] leading-5 text-muted">{next.body}</p>
                            </div>
                          </div>

                          <div className="flex flex-row items-start justify-between gap-3 md:flex-col md:items-end md:justify-start">
                            <div className="flex flex-wrap gap-1.5">
                              <StatusBadge kind="application" value={application.status} t={t} />
                              <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                            </div>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-forest-800 transition-colors group-hover:text-clay-600">
                              {t.common.details}
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="border border-line bg-paper p-5">
              <p className="eyebrow-muted text-[10px]">{t.account.requestData}</p>
              <p className="mt-2 text-[12px] leading-6 text-muted">{t.account.dataRequestBody}</p>
              <div className="mt-4">
                <DataRequestForm locale={locale} t={t} />
              </div>
            </div>

            <div className="border-l-2 border-clay pl-4">
              <p className="text-[12px] font-semibold text-forest-900">{t.home.disclosureTitle}</p>
              <p className="mt-1.5 text-[11.5px] leading-5 text-muted">{t.home.footerDisclaimer}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
