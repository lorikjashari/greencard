# Pricing Engine — Specification

**Related:** [`../BLUEPRINT.md`](../BLUEPRINT.md) §2
**Purpose:** Turn household answers into exactly one price tier, deterministically, with every edge case covered by a test.

---

## 1. Why this is its own module

Pricing is the only place where a bug costs real money and creates a customer dispute. It must be:

- **pure** — no DB, no network, no UI state;
- **versioned** — `rules_version` is snapshotted onto each order;
- **total** — every possible input returns a tier, never `undefined`;
- **auditable** — it returns *why* it chose the tier.

---

## 2. Inputs

```ts
type MaritalStatus =
  | "single"      // i/e pamartuar
  | "married"     // i/e martuar
  | "divorced"    // i/e shkurorëzuar
  | "widowed"     // i/e vejë
  | "separated";  // i ndarë ligjërisht

interface ChildInput {
  dob: string;          // ISO date
  married: boolean;     // child's own marital status
  isStepchild?: boolean;// counts the same if under 21 & unmarried
}

interface HouseholdInput {
  maritalStatus: MaritalStatus;
  spouseIncluded: boolean; // false only for US-citizen spouse or legal separation
  children: ChildInput[];
  entryDate: string;       // ISO date — the DV entry date, not "today"
}
```

## 3. Outputs

```ts
interface TierResult {
  tier: "individual" | "couple" | "family";
  priceCents: 1250 | 1750 | 2750;
  currency: "EUR";
  rulesVersion: "2027.1";
  derivativeChildren: number;   // entered in the DV application
  excludedChildren: number;     // 21+ or married → not entered
  needsReview: boolean;         // ambiguous case → admin must confirm
  warnings: string[];           // DV-validity warnings shown to staff
  reasons: string[];            // human-readable audit trail
}
```

## 4. Price table

| Tier | Cents | Display |
|---|---|---|
| `individual` | 1250 | €12.50 |
| `couple` | 1750 | €17.50 |
| `family` | 2750 | €27.50 |

Flat per application. Children never multiply the price.

## 5. Decision table

| # | maritalStatus | spouseIncluded | derivative children | Tier | Review? | Note |
|---|---|---|---|---|---|---|
| 1 | single | — | 0 | individual | no | client rule |
| 2 | divorced | — | 0 | individual | no | treated as unmarried |
| 3 | widowed | — | 0 | individual | no | treated as unmarried |
| 4 | separated | — | 0 | individual | **yes** | legal separation must be evidenced |
| 5 | married | true | 0 | couple | no | client rule |
| 6 | married | true | ≥1 | family | no | client rule |
| 7 | married | false | 0 | individual | **yes** | US-citizen spouse / separation |
| 8 | married | false | ≥1 | family | **yes** | still a family entry |
| 9 | single/divorced/widowed | — | ≥1 | family | **yes** | not in client rules — recommended |
| 10 | any | any | children all 21+ or married | per rows above with 0 derivatives | no | they are not derivatives |

Rule 10 is the one that trips people up: a 45-year-old applicant with three adult children is **Individual**, not Family.

## 6. Derivative child definition

A child is a **derivative** (must be entered, counts toward the tier) when **both**:

- `age(child, entryDate) < 21`, and
- `child.married === false`.

Stepchildren of the applicant count exactly the same as biological children, provided they are under 21 and unmarried at the time of entry.

**CSPA note:** a child who turns 21 between entry and interview may still be protected under the Child Status Protection Act. That is a post-selection legal question and must **not** be decided by this engine — flag it in admin notes instead.

## 7. Reference implementation

```ts
export const PRICES = {
  individual: 1250,
  couple: 1750,
  family: 2750,
} as const;

export const RULES_VERSION = "2027.1";

function ageAt(dobISO: string, atISO: string): number {
  const dob = new Date(dobISO);
  const at = new Date(atISO);
  let age = at.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < dob.getUTCMonth() ||
    (at.getUTCMonth() === dob.getUTCMonth() && at.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function resolveTier(input: HouseholdInput): TierResult {
  const { maritalStatus, spouseIncluded, children, entryDate } = input;

  const derivatives = children.filter(
    (c) => !c.married && ageAt(c.dob, entryDate) < 21
  );
  const excluded = children.length - derivatives.length;
  const derivativeChildren = derivatives.length;

  const warnings: string[] = [];
  const reasons: string[] = [];
  let needsReview = false;

  const isMarried = maritalStatus === "married";
  const isSeparated = maritalStatus === "separated";

  let tier: TierResult["tier"];

  if (derivativeChildren > 0) {
    tier = "family";
    reasons.push(`${derivativeChildren} derivative child(ren) → family tier`);
    if (!isMarried || !spouseIncluded) {
      needsReview = true;
      warnings.push(
        "Applicant has children but is not applying with a spouse — confirm the household composition before filing."
      );
    }
    if (!isMarried && derivativeChildren > 0) {
      warnings.push("Single-parent household: verify guardianship and the other parent's consent for the child's data.");
    }
  } else if (isMarried && spouseIncluded) {
    tier = "couple";
    reasons.push("Married, spouse included, no derivative children → couple tier");
  } else {
    tier = "individual";
    reasons.push("No spouse and no derivative children → individual tier");
    if (isMarried && !spouseIncluded) {
      needsReview = true;
      warnings.push(
        "Married but spouse excluded. A DV entry is invalid unless the spouse is a US citizen or the couple is legally separated — collect the reason and evidence."
      );
    }
    if (isSeparated) {
      needsReview = true;
      warnings.push("Legal separation claimed — requires documentation.");
    }
  }

  if (excluded > 0) {
    warnings.push(
      `${excluded} child(ren) excluded (21 or older, or married) — not entered in the DV application.`
    );
  }

  if (maritalStatus === "married" && !spouseIncluded && derivativeChildren > 0) {
    warnings.push("Spouse appears in the household but is excluded from the entry — confirm before filing.");
  }

  return {
    tier,
    priceCents: PRICES[tier],
    currency: "EUR",
    rulesVersion: RULES_VERSION,
    derivativeChildren,
    excludedChildren: excluded,
    needsReview,
    warnings,
    reasons,
  };
}
```

## 8. Test matrix

Every row below is a unit test. `entryDate` fixed at `2027-10-15`.

| # | Input | Expected tier | Price | Review |
|---|---|---|---|---|
| 1 | single, 0 children | individual | 1250 | no |
| 2 | divorced, 0 children | individual | 1250 | no |
| 3 | widowed, 0 children | individual | 1250 | no |
| 4 | married, spouse included, 0 children | couple | 1750 | no |
| 5 | married, spouse included, 1 child born 2010 | family | 2750 | no |
| 6 | married, spouse included, 3 children (2010, 2013, 2018) | family | 2750 | no |
| 7 | married, spouse included, 2 children both married | couple | 1750 | no |
| 8 | married, spouse included, child born 2000 (27 y/o) | couple | 1750 | no |
| 9 | child born 2006-10-16 (turns 21 the day after entry) | family | 2750 | no |
| 10 | child born 2006-10-14 (turned 21 two days before entry) | couple | 1750 | no |
| 11 | married, spouse excluded (US citizen), 0 children | individual | 1250 | **yes** |
| 12 | married, spouse excluded, 1 minor child | family | 2750 | **yes** |
| 13 | single, 1 minor child | family | 2750 | **yes** |
| 14 | separated, 0 children | individual | 1250 | **yes** |
| 15 | single, 4 children (2 minor, 2 adult) | family | 2750 | no |
| 16 | married, spouse included, 0 children, 1 adult child | couple | 1750 | no |

Boundary tests 9 and 10 exist because DV age is computed **as of the entry date**, not as of payment or filing. A one-day error changes the price.

## 9. Where the result is used

| Consumer | Field used |
|---|---|
| Checkout | `priceCents`, `currency` — frozen onto `orders` |
| Order record | `rulesVersion` — so a later rule change never rewrites history |
| Funnel UI | `tier` — label "Aplikim Individual / për Çifte / Familjar" |
| Admin | `needsReview`, `warnings`, `reasons` |
| DV entry builder | `derivativeChildren`, child records — determines the required form blocks |

## 10. Change procedure

1. Change `RULES_VERSION` (`2027.2`, …).
2. Update the table in this file and the client-facing price page.
3. Add/adjust tests; all rows in §8 must pass.
4. Deploy. **Existing orders keep their original `rulesVersion` and amount.**
5. Never recalculate historical orders.

---

## 11. Open items affecting this module

| Ref | Question | Default until answered |
|---|---|---|
| BLUEPRINT §16 Q2 | Single parent with children → Family? | Yes (row 9, `needsReview`) |
| BLUEPRINT §16 Q3 | Married, spouse excluded → Individual? | Yes (row 7, `needsReview`) |
| BLUEPRINT §16 Q1 | €750 post-selection fee still applies? | **Not modelled** — must be resolved before checkout copy is written |
| BLUEPRINT §16 Q6 | Price per DV year? | Assumed one year per payment |
