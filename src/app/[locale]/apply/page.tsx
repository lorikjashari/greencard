import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplicationWizard } from "@/features/applications/wizard";
import { getPublicConfig } from "@/lib/config";
import { getSettings } from "@/lib/repo/settings";
import { POLICY_VERSION } from "@/lib/policy";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aplikimi DV",
  robots: { index: false, follow: false },
};

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ h?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { h } = await searchParams;

  const config = getPublicConfig();
  const settings = await getSettings();
  const t = copy(locale);

  return (
    <div>
      <div className="border-b border-line bg-paper">
        <div className="container-page flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
          <div className="flex items-baseline gap-3">
            <p className="eyebrow text-[10px]">{t.common.brand}</p>
            <h1 className="font-serif text-[19px] leading-none tracking-[-0.01em] text-forest-900">{t.apply.title}</h1>
          </div>
          <p className="text-[11.5px] text-muted">{t.apply.savedLocally}</p>
        </div>
      </div>

      <ApplicationWizard
        locale={locale}
        t={t}
        demo={config.demo}
        cardEnabled={config.cardPaymentsEnabled}
        prices={settings.prices}
        rulesVersion={settings.pricingRulesVersion}
        policyVersion={POLICY_VERSION}
        handoff={h}
      />
    </div>
  );
}
