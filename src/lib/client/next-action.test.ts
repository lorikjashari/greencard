import { describe, expect, it } from "vitest";
import { nextActionFor } from "./next-action";
import type { ApplicationRecord, OrderRecord } from "@/lib/types";

/**
 * The portal's "next action" line is the single message every applicant reads
 * first, so its precedence rules are worth pinning down: an information request
 * must beat a payment reminder, and closed cases must never ask for money.
 */
function application(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: "app-1",
    ref: "GCK-TEST1",
    dvYear: 2027,
    locale: "sq",
    status: "submitted",
    paymentStatus: "paid",
    packageKey: "individual",
    amountCents: 1250,
    currency: "EUR",
    pricingRulesVersion: "2027.1",
    household: { maritalStatus: "single", spouseIncluded: false },
    applicant: {
      firstName: "Test",
      middleName: "",
      lastName: "Applicant",
      dateOfBirth: "1990-01-01",
      gender: "female",
      birthCity: "Prishtina",
      birthCountry: "XK",
      eligibilityCountry: "XK",
      nationality: "XK",
      education: "high_school",
    },
    spouse: null,
    children: [],
    contact: { email: "client@example.com", phone: "+383 44 000 000" },
    consents: [],
    photos: [],
    completeness: { dataComplete: true, missing: [] },
    duplicate: { level: "none", matches: [] },
    assigneeId: null,
    ownerEmail: "client@example.com",
    claimedByUid: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    submittedAt: "2026-10-01T10:05:00.000Z",
    ...overrides,
  } as ApplicationRecord;
}

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    applicationId: "app-1",
    ref: "PAY-TEST1",
    amountCents: 1250,
    currency: "EUR",
    method: "cash",
    status: "pending_cash",
    createdAt: "2026-10-01T10:05:00.000Z",
    updatedAt: "2026-10-01T10:05:00.000Z",
    expiresAt: "2026-10-10T10:05:00.000Z",
    ...overrides,
  } as OrderRecord;
}

describe("nextActionFor", () => {
  it("asks for information before anything else when staff requested it", () => {
    const result = nextActionFor(
      application({ status: "needs_information", paymentStatus: "pending_cash", statusReason: "Photo is cropped." }),
      order(),
      "en",
    );
    expect(result.needsClient).toBe(true);
    expect(result.body).toBe("Photo is cropped.");
  });

  it("prompts for payment while cash is outstanding, including the reference", () => {
    const result = nextActionFor(application({ paymentStatus: "pending_cash" }), order(), "en");
    expect(result.title).toBe("Complete your payment");
    expect(result.body).toContain("PAY-TEST1");
    expect(result.needsClient).toBe(true);
  });

  it("never asks for payment on a cancelled case", () => {
    const result = nextActionFor(application({ status: "cancelled", paymentStatus: "pending_cash" }), order(), "en");
    expect(result.title).not.toBe("Complete your payment");
  });

  it("tells the client to wait while the case is in review", () => {
    const result = nextActionFor(application({ status: "in_review" }), null, "sq");
    expect(result.needsClient).toBe(false);
    expect(result.title).toBe("Në kontroll nga stafi");
  });

  it("reports the filing once it is recorded", () => {
    const result = nextActionFor(application({ status: "filed" }), null, "en");
    expect(result.title).toBe("Entry filed");
    expect(result.needsClient).toBe(false);
  });

  it("falls back to contacting the office for unmodelled statuses", () => {
    const result = nextActionFor(application({ status: "expired" }), null, "en");
    expect(result.needsClient).toBe(true);
    expect(result.title).toBe("Contact the office");
  });
});
