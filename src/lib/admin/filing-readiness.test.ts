import { describe, expect, it } from "vitest";
import { filingBlockers } from "./filing-readiness";

type App = Parameters<typeof filingBlockers>[0];
type Order = Parameters<typeof filingBlockers>[1];

function application(overrides: Partial<App> = {}): App {
  return {
    status: "ready_to_file",
    paymentStatus: "paid",
    completeness: { dataComplete: true, photosApproved: true, missing: [] },
    household: { spouseIncluded: false } as App["household"],
    spouse: null,
    children: [],
    photos: [
      {
        id: "photo-1",
        memberKey: "applicant",
        memberName: "Ada Krasniqi",
        storageKey: "photos/draft/applicant.jpg",
        originalName: "photo.jpg",
        contentType: "image/jpeg",
        bytes: 100,
        width: 600,
        height: 600,
        status: "approved",
        issues: [],
        rulesVersion: "2027.1",
        uploadedAt: "2026-10-01T10:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

const paidOrder: Order = { status: "paid", amountMismatch: false, mismatchReviewedAt: null };

describe("filing readiness", () => {
  it("passes a paid, complete case with approved photos", () => {
    expect(filingBlockers(application(), paidOrder)).toEqual([]);
  });

  it("blocks unreviewed photos and missing data", () => {
    const app = application({
      photos: [{ ...application().photos[0], status: "valid" }],
      completeness: { dataComplete: false, photosApproved: false, missing: ["contact"] },
    });
    expect(filingBlockers(app, paidOrder)).toEqual(["data", "photo"]);
  });

  it("blocks payment and unreviewed amount mismatches", () => {
    expect(filingBlockers(application({ paymentStatus: "pending_cash" }), null)).toEqual(["payment"]);
    expect(
      filingBlockers(application(), { status: "paid", amountMismatch: true, mismatchReviewedAt: null }),
    ).toEqual(["amount_mismatch"]);
    expect(
      filingBlockers(application(), {
        status: "paid",
        amountMismatch: true,
        mismatchReviewedAt: "2026-10-02T10:00:00.000Z",
      }),
    ).toEqual([]);
  });

  it("requires photos for every included family member", () => {
    const app = application({
      household: { spouseIncluded: true } as App["household"],
      spouse: { firstName: "Ben", lastName: "Krasniqi" } as App["spouse"],
    });
    expect(filingBlockers(app, paidOrder)).toEqual(["photo"]);
  });
});
