import type { Metadata } from "next";
import { getPublicConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

export const SITE_NAME = "Aplikodv";
export const SITE_TAGLINE = "Apliko Green Card USA";

export const SITE_DESCRIPTION: Record<Locale, string> = {
  sq: "Aplikodv — Apliko Green Card USA. Përgatitje, kontroll dhe dorëzim i aplikimit për Lotarinë e Vizave të Diversitetit (DV) në Kosovë, me proces të qartë dhe mbështetje nga stafi.",
  en: "Aplikodv — Apliko Green Card USA. Careful preparation, review and submission of your Diversity Visa (DV) lottery application in Kosovo, with a clear process and human support.",
};

export const SITE_KEYWORDS: Record<Locale, string[]> = {
  sq: [
    "Aplikodv",
    "Apliko Green Card USA",
    "Green Card",
    "Green Card Kosova",
    "Lotaria e Vizave",
    "DV Lottery",
    "aplikim Green Card",
    "viza amerikane",
    "Viti",
    "Kosovë",
  ],
  en: [
    "Aplikodv",
    "Apliko Green Card USA",
    "Green Card",
    "Green Card Kosovo",
    "DV Lottery",
    "Diversity Visa",
    "US visa application",
    "Viti",
    "Kosovo",
  ],
};

export function siteUrl(): string {
  return getPublicConfig().appUrl.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/${locale}${clean}`;
}

export function ogImage(locale: Locale): string {
  return absoluteUrl(`/og/aplikodv-${locale}.png`);
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  ogTitle,
  noindex = false,
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  noindex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(localePath(locale, path));
  const image = ogImage(locale);
  const socialTitle = ogTitle ?? `${title} · ${SITE_NAME}`;
  const languages = {
    sq: absoluteUrl(localePath("sq", path)),
    en: absoluteUrl(localePath("en", path)),
    "x-default": absoluteUrl(localePath("sq", path)),
  };

  return {
    title,
    description,
    keywords: keywords ?? SITE_KEYWORDS[locale],
    alternates: { canonical, languages },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: canonical,
      locale: locale === "sq" ? "sq_AL" : "en_GB",
      alternateLocale: [locale === "sq" ? "en_GB" : "sq_AL"],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export function siteGraph(locale: Locale) {
  const config = getPublicConfig();
  const base = siteUrl();
  const organizationId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const serviceId = `${base}/#service`;
  const description = SITE_DESCRIPTION[locale];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: SITE_TAGLINE,
        url: base,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/brand/logo.png"),
          width: 1200,
          height: 251,
        },
        image: ogImage(locale),
        description,
        email: config.contact.email,
        telephone: config.contact.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Rruga Mejdi Korrani, Pozhoran",
          addressLocality: "Viti",
          postalCode: "61060",
          addressCountry: "XK",
        },
        areaServed: { "@type": "Country", name: "Kosovo" },
        knowsLanguage: ["sq", "en"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: config.contact.email,
            telephone: config.contact.phone,
            availableLanguage: ["sq", "en"],
            areaServed: "XK",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: base,
        name: SITE_NAME,
        description,
        inLanguage: ["sq", "en"],
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name:
          locale === "sq"
            ? "Përgatitje dhe dorëzim i aplikimit DV"
            : "DV application preparation and submission",
        serviceType: "Diversity Visa application preparation",
        description,
        provider: { "@id": organizationId },
        areaServed: { "@type": "Country", name: "Kosovo" },
        availableLanguage: ["sq", "en"],
        url: `${base}/${locale}`,
      },
    ],
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(
  locale: Locale,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localePath(locale, item.path)),
    })),
  };
}
