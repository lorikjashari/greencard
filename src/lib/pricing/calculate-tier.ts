import type { ChildData, MaritalStatus, PackageKey } from "@/lib/types";

/**
 * Pricing engine — pure, deterministic, no I/O.
 *
 * The browser uses this only to display a price preview. The server calls
 * the same function on submit and on order creation, and never accepts a
 * tier or amount from the client.
 */

export const DEFAULT_PRICES: Record<PackageKey, number> = {
  individual: 1250,
  couple: 1750,
  family: 2750,
};

export const DEFAULT_PRICING_RULES_VERSION = "2027.1";

export interface HouseholdInput {
  maritalStatus: MaritalStatus | "";
  spouseIncluded: boolean;
  children: Array<Pick<ChildData, "dateOfBirth" | "married">>;
  entryDate: string; // ISO date
}

export type TierWarningCode =
  | "single_parent_children"
  | "spouse_excluded_with_children"
  | "spouse_excluded"
  | "separated"
  | "excluded_children";

export interface TierWarning {
  code: TierWarningCode;
  count?: number;
}

export interface TierResult {
  tier: PackageKey | null;
  priceCents: number | null;
  currency: "EUR";
  rulesVersion: string;
  derivativeChildren: number;
  excludedChildren: number;
  needsReview: boolean;
  /** Policy questions the client has not resolved yet. */
  pendingPolicy: Array<"single_parent" | "spouse_excluded">;
  warnings: TierWarning[];
  reasons: string[];
}

export function calculateAge(dateOfBirth: string, atDate: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  const at = new Date(`${atDate}T00:00:00Z`);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return Number.NaN;

  let age = at.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = at.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function isDerivativeChild(
  child: Pick<ChildData, "dateOfBirth" | "married">,
  entryDate: string,
): boolean {
  if (child.married) return false;
  const age = calculateAge(child.dateOfBirth, entryDate);
  return Number.isFinite(age) && age >= 0 && age < 21;
}

export function resolveTier(
  input: HouseholdInput,
  options?: {
    prices?: Record<PackageKey, number>;
    rulesVersion?: string;
  },
): TierResult {
  const prices = options?.prices ?? DEFAULT_PRICES;
  const rulesVersion = options?.rulesVersion ?? DEFAULT_PRICING_RULES_VERSION;

  const warnings: TierResult["warnings"] = [];
  const reasons: string[] = [];
  const pendingPolicy: TierResult["pendingPolicy"] = [];
  let needsReview = false;

  const { maritalStatus, spouseIncluded, entryDate } = input;

  if (!maritalStatus) {
    return {
      tier: null,
      priceCents: null,
      currency: "EUR",
      rulesVersion,
      derivativeChildren: 0,
      excludedChildren: 0,
      needsReview: false,
      pendingPolicy,
      warnings: [],
      reasons: ["Marital status not answered yet"],
    };
  }

  const derivatives = input.children.filter((child) => isDerivativeChild(child, entryDate));
  const derivativeChildren = derivatives.length;
  const excludedChildren = input.children.length - derivativeChildren;

  const isMarried = maritalStatus === "married";

  let tier: PackageKey;

  if (derivativeChildren > 0) {
    tier = "family";
    reasons.push(
      `Ka ${derivativeChildren} fëmijë derivativë (nën 21 vjeç dhe të pamartuar) → paketa Familjar.`,
    );

    if (!isMarried || !spouseIncluded) {
      needsReview = true;
      pendingPolicy.push("single_parent");
      warnings.push({ code: "single_parent_children" });
      if (isMarried && !spouseIncluded) {
        warnings.push({ code: "spouse_excluded_with_children" });
      }
    }
  } else if (isMarried && spouseIncluded) {
    tier = "couple";
    reasons.push("I/e martuar, bashkëshorti përfshihet, pa fëmijë derivativë → paketa për Çifte.");
  } else {
    tier = "individual";
    reasons.push("Pa bashkëshort dhe pa fëmijë derivativë → paketa Individual.");

    if (isMarried && !spouseIncluded) {
      needsReview = true;
      pendingPolicy.push("spouse_excluded");
      warnings.push({ code: "spouse_excluded" });
    }
    if (maritalStatus === "separated") {
      needsReview = true;
      warnings.push({ code: "separated" });
    }
  }

  if (excludedChildren > 0) {
    warnings.push({ code: "excluded_children", count: excludedChildren });
  }

  return {
    tier,
    priceCents: prices[tier],
    currency: "EUR",
    rulesVersion,
    derivativeChildren,
    excludedChildren,
    needsReview,
    pendingPolicy,
    warnings,
    reasons,
  };
}
