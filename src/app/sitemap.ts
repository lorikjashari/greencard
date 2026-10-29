import type { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/config";
import { LOCALES } from "@/lib/i18n";

/** Only public, indexable routes belong here; the wizard and portal are noindex. */
const PUBLIC_ROUTES = ["", "/faq", "/contact", "/privacy", "/terms", "/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const { appUrl } = getPublicConfig();
  const base = appUrl.replace(/\/$/, "");

  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => ({
      url: `${base}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((other) => [other, `${base}/${other}${route}`])),
      },
    })),
  );
}
