import { describe, expect, it } from "vitest";
import {
  assertApplicationTransition,
  canRoleTransition,
  canTransitionApplication,
  canTransitionPayment,
  hasPermission,
  nextApplicationStatuses,
} from "./transitions";

describe("application state machine", () => {
  it("moves submitted to review", () => {
    expect(canTransitionApplication("submitted", "in_review")).toBe(true);
  });

  it("does not skip review and file directly from submitted", () => {
    expect(canTransitionApplication("submitted", "filed")).toBe(false);
  });

  it("does not leave a terminal state", () => {
    expect(nextApplicationStatuses("cancelled")).toEqual([]);
    expect(nextApplicationStatuses("selected")).toEqual([]);
  });

  it("rejects unknown transitions for a role", () => {
    const result = assertApplicationTransition("operator", "submitted", "selected");
    expect(result.ok).toBe(false);
  });

  it("allows an operator to move a case into review", () => {
    expect(assertApplicationTransition("operator", "submitted", "in_review").ok).toBe(true);
  });

  it("does not let an operator cancel or select cases", () => {
    expect(canRoleTransition("operator", "in_review", "cancelled")).toBe(false);
    expect(canRoleTransition("operator", "filed", "selected")).toBe(false);
    expect(canRoleTransition("admin", "filed", "selected")).toBe(true);
  });
});

describe("payment state machine", () => {
  it("allows pending cash to be paid", () => {
    expect(canTransitionPayment("pending_cash", "paid")).toBe(true);
  });

  it("does not move created directly to paid", () => {
    expect(canTransitionPayment("created", "paid")).toBe(false);
  });

  it("does not refund an unpaid order", () => {
    expect(canTransitionPayment("pending_cash", "refunded")).toBe(false);
  });
});

describe("permissions", () => {
  it("gives admins sensitive access and export", () => {
    expect(hasPermission("admin", "applications.view_sensitive")).toBe(true);
    expect(hasPermission("admin", "applications.export")).toBe(true);
  });

  it("keeps accountants out of sensitive case data and photos", () => {
    expect(hasPermission("accountant", "applications.view")).toBe(true);
    expect(hasPermission("accountant", "payments.reconcile")).toBe(true);
    expect(hasPermission("accountant", "applications.view_sensitive")).toBe(false);
    expect(hasPermission("accountant", "photos.review")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission("viewer", "reports.view")).toBe(true);
    expect(hasPermission("viewer", "applications.transition")).toBe(false);
    expect(hasPermission("viewer", "payments.reconcile")).toBe(false);
  });

  it("never grants staff permissions to clients", () => {
    expect(hasPermission("client", "applications.view")).toBe(false);
    expect(hasPermission("client", "payments.view")).toBe(false);
  });
});
