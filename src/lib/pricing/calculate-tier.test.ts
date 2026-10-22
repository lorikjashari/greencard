import { describe, expect, it } from "vitest";
import {
  calculateAge,
  isDerivativeChild,
  resolveTier,
  type HouseholdInput,
} from "./calculate-tier";

const base = (overrides: Partial<HouseholdInput>): HouseholdInput => ({
  maritalStatus: "single",
  spouseIncluded: false,
  children: [],
  entryDate: "2026-10-01",
  ...overrides,
});

describe("calculateAge", () => {
  it("counts a birthday that has already occurred", () => {
    expect(calculateAge("2000-01-15", "2026-10-01")).toBe(26);
  });

  it("does not count a birthday later in the year", () => {
    expect(calculateAge("2000-12-15", "2026-10-01")).toBe(25);
  });

  it("returns NaN for invalid input", () => {
    expect(Number.isNaN(calculateAge("not-a-date", "2026-10-01"))).toBe(true);
  });
});

describe("isDerivativeChild", () => {
  it("includes an unmarried child under 21", () => {
    expect(isDerivativeChild({ dateOfBirth: "2006-10-02", married: false }, "2026-10-01")).toBe(true);
  });

  it("excludes a child who turns 21 the day before entry", () => {
    expect(isDerivativeChild({ dateOfBirth: "2005-10-01", married: false }, "2026-10-01")).toBe(false);
  });

  it("excludes married children regardless of age", () => {
    expect(isDerivativeChild({ dateOfBirth: "2010-01-01", married: true }, "2026-10-01")).toBe(false);
  });
});

describe("resolveTier", () => {
  it("returns no tier until marital status is answered", () => {
    const result = resolveTier(base({ maritalStatus: "" }));
    expect(result.tier).toBeNull();
    expect(result.priceCents).toBeNull();
  });

  it("charges the individual price for a single applicant", () => {
    const result = resolveTier(base({}));
    expect(result.tier).toBe("individual");
    expect(result.priceCents).toBe(1250);
    expect(result.needsReview).toBe(false);
  });

  it("charges the couple price for a married applicant including the spouse", () => {
    const result = resolveTier(base({ maritalStatus: "married", spouseIncluded: true }));
    expect(result.tier).toBe("couple");
    expect(result.priceCents).toBe(1750);
  });

  it("charges the family price when a derivative child is present", () => {
    const result = resolveTier(
      base({
        maritalStatus: "married",
        spouseIncluded: true,
        children: [{ dateOfBirth: "2012-05-10", married: false }],
      }),
    );
    expect(result.tier).toBe("family");
    expect(result.priceCents).toBe(2750);
    expect(result.derivativeChildren).toBe(1);
  });

  it("does not charge family for an excluded adult child", () => {
    const result = resolveTier(
      base({
        maritalStatus: "married",
        spouseIncluded: true,
        children: [{ dateOfBirth: "2000-05-10", married: false }],
      }),
    );
    expect(result.tier).toBe("couple");
    expect(result.excludedChildren).toBe(1);
    expect(result.warnings).toContainEqual({ code: "excluded_children", count: 1 });
  });

  it("flags a single parent household for policy review", () => {
    const result = resolveTier(
      base({ children: [{ dateOfBirth: "2015-05-10", married: false }] }),
    );
    expect(result.tier).toBe("family");
    expect(result.needsReview).toBe(true);
    expect(result.pendingPolicy).toContain("single_parent");
    expect(result.warnings.map((warning) => warning.code)).toContain("single_parent_children");
  });

  it("flags a married applicant excluding the spouse for policy review", () => {
    const result = resolveTier(base({ maritalStatus: "married", spouseIncluded: false }));
    expect(result.tier).toBe("individual");
    expect(result.pendingPolicy).toContain("spouse_excluded");
    expect(result.warnings.map((warning) => warning.code)).toContain("spouse_excluded");
  });

  it("uses configured prices and rules version", () => {
    const result = resolveTier(base({}), {
      prices: { individual: 999, couple: 1500, family: 2500 },
      rulesVersion: "test-1",
    });
    expect(result.priceCents).toBe(999);
    expect(result.rulesVersion).toBe("test-1");
  });
});
