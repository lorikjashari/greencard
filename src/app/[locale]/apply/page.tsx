import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplicationWizard } from "@/features/applications/wizard";
import { getPublicConfig } from "@/lib/config";
import { getSettings } from "@/lib/repo/settings";
import { POLICY_VERSION } from "@/lib/policy";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { copy } from "@/messages/get";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "sq";
  return pageMetadata({
    locale,
    path: "/apply",
    title: pick(locale, "Aplikimi DV", "DV application"),
    description: pick(
      locale,
      "Formulari i aplikimit DV, i ruajtur në mënyrë të sigurt dhe i kontrolluar nga stafi.",
      "The DV application form, securely saved and reviewed by staff.",
    ),
    noindex: true,
  });
}

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
