import "server-only";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export const ADMIN_LOCALE_COOKIE = "gck_admin_locale";

/**
 * Staff UI language. Defaults to Albanian; staff can switch to English from
 * the admin shell. The choice is stored in a cookie so it survives navigation.
 */
export async function adminLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(ADMIN_LOCALE_COOKIE)?.value === "en" ? "en" : "sq";
}
