export type Locale = "sq" | "en";

/** A localized leaf keeps both translations adjacent so neither can drift. */
export type I18nLeaf = { sq: string; en: string };

export type Localized<T> = {
  [K in keyof T]: T[K] extends I18nLeaf ? string : T[K] extends object ? Localized<T[K]> : never;
};

export function localize<T>(value: T, locale: Locale): Localized<T> {
  if (
    value &&
    typeof value === "object" &&
    "sq" in (value as Record<string, unknown>) &&
    "en" in (value as Record<string, unknown>)
  ) {
    return (value as unknown as I18nLeaf)[locale] as Localized<T>;
  }
  const output: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    output[key] = localize(inner, locale);
  }
  return output as Localized<T>;
}

/** Inline bilingual string, for one-off admin labels. */
export function pick(locale: Locale, sq: string, en: string): string {
  return locale === "sq" ? sq : en;
}

export const LOCALES: Locale[] = ["sq", "en"];
export const DEFAULT_LOCALE: Locale = "sq";

export function isLocale(value: string): value is Locale {
  return value === "sq" || value === "en";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "sq" ? "en" : "sq";
}
