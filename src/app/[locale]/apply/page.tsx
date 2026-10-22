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
      <div className="border-b border-line bg-white">
        <div className="container-page py-5">
          <p className="eyebrow">{t.common.brand}</p>
          <h1 className="mt-1 font-serif text-2xl tracking-[-0.01em] text-forest-900 sm:text-[28px]">
            {t.apply.title}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">{t.apply.savedLocally}</p>
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
