import { messages } from "./index";
import { localize, type Locale, type Localized } from "@/lib/i18n";

export type Copy = Localized<typeof messages>;

const cache = new Map<Locale, Copy>();

export function copy(locale: Locale): Copy {
  const cached = cache.get(locale);
  if (cached) return cached;
  const localized = localize(messages, locale);
  cache.set(locale, localized);
  return localized;
}

export { messages };
