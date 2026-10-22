import type { Locale } from "@/lib/i18n";

/**
 * ISO 3166-1 alpha-2 codes used in the DV form. Names are derived at runtime
 * with Intl.DisplayNames, so both languages stay current without a hand-
 * maintained translation table. XK (Kosovo) has no ISO assignment and is
 * handled explicitly.
 */
export const COUNTRY_CODES = [
  "AF","AL","DZ","AD","AO","AI","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BA","BW","BR","IO","VG","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ET","FK","FO","FJ","FI","FR","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GT","GN","GW","GY","HT","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NZ","NI","NE","NG","NU","NF","KP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","QA","RO","RU","RW","BL","KN","LC","MF","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","KR","SS","ES","LK","SH","PM","SD","SR","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UY","UZ","VU","VA","VE","VN","WF","EH","YE","ZM","ZW",
  "XK",
] as const;

const SPECIAL: Record<string, { sq: string; en: string }> = {
  XK: { sq: "Kosovë", en: "Kosovo" },
  GB: { sq: "Mbretëria e Bashkuar", en: "United Kingdom" },
  US: { sq: "Shtetet e Bashkuara", en: "United States" },
  MK: { sq: "Maqedonia e Veriut", en: "North Macedonia" },
  TW: { sq: "Tajvan", en: "Taiwan" },
};

const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

function displayNames(locale: Locale): Intl.DisplayNames | null {
  const key = locale === "sq" ? "sq" : "en";
  if (displayNamesCache.has(key)) return displayNamesCache.get(key) ?? null;
  try {
    const instance = new Intl.DisplayNames([key], { type: "region" });
    displayNamesCache.set(key, instance);
    return instance;
  } catch {
    displayNamesCache.set(key, null);
    return null;
  }
}

export function countryName(code: string, locale: Locale): string {
  if (!code) return "";
  const special = SPECIAL[code];
  if (special) return special[locale];
  const names = displayNames(locale);
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryOptions(locale: Locale): Array<{ value: string; label: string }> {
  return COUNTRY_CODES.map((code) => ({ value: code, label: countryName(code, locale) })).sort((a, b) =>
    a.label.localeCompare(b.label, locale === "sq" ? "sq" : "en"),
  );
}

export function isKnownCountry(code: string): boolean {
  return (COUNTRY_CODES as readonly string[]).includes(code);
}
