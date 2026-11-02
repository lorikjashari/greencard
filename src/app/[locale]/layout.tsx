import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { isLocale, type Locale } from "@/lib/i18n";
import {
  SITE_KEYWORDS,
  SITE_NAME,
  pageMetadata,
  siteGraph,
} from "@/lib/seo";
import { copy } from "@/messages/get";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LocaleLang } from "@/components/layout/locale-lang";
import { JsonLd } from "@/components/seo/json-ld";

export function generateStaticParams() {
  return [{ locale: "sq" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "sq";
  const t = copy(l);
  const title =
    l === "sq"
      ? "Aplikodv — Aplikimi DV i përgatitur me kujdes"
      : "Aplikodv — Your DV application, carefully prepared";
  return {
    ...pageMetadata({
      locale: l,
      path: "",
      title,
      description: t.home.sub,
      keywords: SITE_KEYWORDS[l],
      ogTitle: title,
    }),
    title: { default: title, template: `%s · ${SITE_NAME}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = copy(locale);
  const config = getPublicConfig();

  return (
    <>
      <LocaleLang locale={locale} />
      <JsonLd data={siteGraph(locale)} />
      {config.demo && <DemoBanner t={t} />}
      <SiteHeader locale={locale} t={t} contact={config.contact} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter locale={locale} t={t} config={config} />
    </>
  );
}
