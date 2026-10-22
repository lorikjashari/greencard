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
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{t.account.title}</p>
            <h1 className="mt-1.5 font-serif text-3xl tracking-[-0.02em] text-forest-900">
              {t.account.greeting}, {session.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{session.email}</p>
          </div>
          <SignOutButton label={t.common.signOut} redirectTo={`/${locale}`} />
        </div>

        {notice === "data" && (
          <div className="mt-6 flex items-start gap-2 rounded-md border border-forest-200 bg-forest-50 p-3.5 text-[13px] text-forest-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.account.dataRequestBody}
          </div>
        )}

        <div className="mt-8">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-line bg-white">
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
            <ul className="space-y-4">
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
                  <li key={application.id}>
                    <Link
                      href={`/${locale}/account/${application.id}`}
                      className="group block rounded-lg border border-line bg-white p-5 shadow-card transition-colors hover:border-forest-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[13px] font-semibold tracking-wide text-forest-900">
                            {application.ref}
                          </p>
                          <p className="mt-1 text-[13px] text-ink/80">
                            {packageLabel} · {formatCurrency(application.amountCents, locale)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge kind="application" value={application.status} t={t} />
                          <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
                        </div>
                      </div>

                      <div className="mt-4 rounded-md bg-ivory/70 px-3.5 py-3">
                        <p className="text-2xs font-semibold uppercase tracking-wide text-muted">
                          {t.account.nextAction}
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-ink">{next.title}</p>
                        <p className="mt-0.5 text-[12px] leading-5 text-muted">{next.body}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-2xs text-muted">
                          {tx("Dorëzuar", "Submitted")}:{" "}
                          {formatDate(application.submittedAt ?? application.createdAt, locale)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest group-hover:underline">
                          {t.common.details}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold text-ink">{t.account.requestData}</h2>
          <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{t.account.dataRequestBody}</p>
          <div className="mt-3">
            <DataRequestForm locale={locale} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
