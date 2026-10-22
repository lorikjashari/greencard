import "server-only";

import { headers } from "next/headers";
import type { Locale } from "@/lib/i18n";

/**
 * Staff UI language follows the browser's Accept-Language header. Public and
 * portal screens use the /sq or /en route segment instead.
 */
export async function adminLocale(): Promise<Locale> {
  const headerList = await headers();
  const accept = headerList.get("accept-language")?.toLowerCase() ?? "";
  return accept.startsWith("en") ? "en" : "sq";
}
