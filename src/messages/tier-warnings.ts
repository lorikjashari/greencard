import type { Locale } from "@/lib/i18n";
import type { TierWarning, TierWarningCode } from "@/lib/pricing/calculate-tier";

const TIER_WARNINGS: Record<TierWarningCode, { sq: string; en: string }> = {
  single_parent_children: {
    sq: "Aplikanti ka fëmijë por nuk aplikon me bashkëshort/e. Konfirmo përbërjen e familjes para dorëzimit.",
    en: "The applicant has children but is not applying with a spouse. Confirm the household before submission.",
  },
  spouse_excluded_with_children: {
    sq: "Bashkëshorti është i përjashtuar, por fëmijët janë pjesë e aplikimit. Kjo kërkon verifikim të bazës ligjore.",
    en: "The spouse is excluded but the children are part of the application. This requires verification of the legal basis.",
  },
  spouse_excluded: {
    sq: "I/e martuar pa bashkëshort në aplikim. Sipas rregullave të DV-së kjo është e vlefshme vetëm nëse bashkëshorti është shtetas amerikan ose çifti është ligjërisht i ndarë. Kërkohet arsyeja dhe dokumentacioni.",
    en: "Married without the spouse in the application. Under DV rules this is valid only if the spouse is a US citizen or the couple is legally separated. The reason and documents are required.",
  },
  separated: {
    sq: "Ndarje ligjërisht e deklaruar — kërkohet dokumentacion.",
    en: "Declared legal separation — documentation is required.",
  },
  excluded_children: {
    sq: "{count} fëmijë nuk përfshihen (21 vjeç ose më shumë, ose të martuar) dhe nuk ndikojnë në çmim.",
    en: "{count} child(ren) are not included (21 or older, or married) and do not affect the price.",
  },
};

/** Localised, human-readable warning for display and stored eligibility notes. */
export function tierWarningText(locale: Locale, warning: TierWarning): string {
  return TIER_WARNINGS[warning.code][locale].replace("{count}", String(warning.count ?? 0));
}
