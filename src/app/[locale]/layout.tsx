import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { LocaleLang } from "@/components/layout/locale-lang";

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
  return {
    title: {
      default: l === "sq" ? "Green Card Kosova — Aplikimi DV i përgatitur me kujdes" : "Green Card Kosova — Your DV application, carefully prepared",
      template: "%s · Green Card Kosova",
    },
    description: t.home.sub,
    alternates: {
      canonical: `/${l}`,
      languages: { sq: "/sq", en: "/en" },
    },
    openGraph: { title: t.home.h1, description: t.home.sub, locale: l === "sq" ? "sq_AL" : "en_GB" },
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
      {config.demo && <DemoBanner t={t} />}
      <SiteHeader locale={locale} t={t} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter locale={locale} t={t} config={config} />
    </>
  );
}
