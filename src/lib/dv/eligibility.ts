import "server-only";

import type { DvYearRecord } from "@/lib/types";

export interface EligibilityInput {
  birthCountry: string;
  education?: string;
}

export function checkEligibility(
  input: EligibilityInput,
  dvYear: Pick<DvYearRecord, "eligibleCountries">,
): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (dvYear.eligibleCountries && dvYear.eligibleCountries.length > 0) {
    if (!dvYear.eligibleCountries.includes(input.birthCountry)) {
      blockers.push(
        "Shteti i lindjes nuk figuron në listën e vendeve të pranueshme për këtë vit DV. Verifiko listën zyrtare.",
      );
    }
  }

  if (input.education === "none") {
    warnings.push(
      "Arsimi i deklaruar është nën shkollë të mesme. Kërkesa minimale e DV-së është shkolla e mesme ose 2 vjet përvojë pune e kualifikuar.",
    );
  }

  return { blockers, warnings };
}
