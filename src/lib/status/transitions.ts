import type { ApplicationStatus, PaymentStatus, Role } from "@/lib/types";

/**
 * State machines are defined once, tested, and enforced on the server.
 * UI code may read them for rendering, but never decides on its own.
 */

const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ["submitted", "cancelled", "expired"],
  submitted: ["in_review", "needs_information", "rejected", "cancelled"],
  in_review: ["needs_information", "ready_to_file", "rejected", "cancelled"],
  needs_information: ["submitted", "in_review", "expired", "cancelled"],
  ready_to_file: ["filed", "needs_information", "cancelled"],
  filed: ["confirmation_sent", "selected", "not_selected"],
  confirmation_sent: ["selected", "not_selected"],
  selected: [],
  not_selected: [],
  cancelled: [],
  expired: [],
  rejected: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  created: ["pending_cash", "pending_card", "failed", "expired"],
  pending_cash: ["paid", "failed", "expired"],
  pending_card: ["paid", "failed", "expired"],
  paid: ["refunded", "disputed"],
  disputed: ["paid", "refunded"],
  refunded: [],
  failed: ["pending_cash", "pending_card", "expired"],
  expired: [],
};

export function nextApplicationStatuses(from: ApplicationStatus): ApplicationStatus[] {
  return APPLICATION_TRANSITIONS[from] ?? [];
}

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return nextApplicationStatuses(from).includes(to);
}

export function nextPaymentStatuses(from: PaymentStatus): PaymentStatus[] {
  return PAYMENT_TRANSITIONS[from] ?? [];
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return nextPaymentStatuses(from).includes(to);
}

/** Which application transitions a role may perform at all. */
const ROLE_TRANSITIONS: Record<Role, ApplicationStatus[]> = {
  admin: [
    "submitted",
    "in_review",
    "needs_information",
    "ready_to_file",
    "filed",
    "confirmation_sent",
    "selected",
    "not_selected",
    "cancelled",
    "expired",
    "rejected",
  ],
  operator: ["in_review", "needs_information", "ready_to_file", "filed", "confirmation_sent"],
  accountant: [],
  viewer: [],
  client: [],
};

export function canRoleTransition(role: Role, _from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ROLE_TRANSITIONS[role]?.includes(to) ?? false;
}

export function assertApplicationTransition(
  role: Role,
  from: ApplicationStatus,
  to: ApplicationStatus,
): { ok: true } | { ok: false; reason: string } {
  if (!canTransitionApplication(from, to)) {
    return { ok: false, reason: `Tranzicioni ${from} → ${to} nuk lejohet nga gjendja aktuale.` };
  }
  if (!canRoleTransition(role, from, to)) {
    return { ok: false, reason: `Roli ${role} nuk mund të kryejë tranzicionin ${from} → ${to}.` };
  }
  return { ok: true };
}

export type Permission =
  | "applications.view"
  | "applications.view_sensitive"
  | "applications.assign"
  | "applications.transition"
  | "applications.export"
  | "photos.review"
  | "payments.view"
  | "payments.reconcile"
  | "payments.refund"
  | "filing.file"
  | "reports.view"
  | "dv.manage"
  | "team.manage"
  | "settings.manage"
  | "audit.view"
  | "data_requests.manage";

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "applications.view",
    "applications.view_sensitive",
    "applications.assign",
    "applications.transition",
    "applications.export",
    "photos.review",
    "payments.view",
    "payments.reconcile",
    "payments.refund",
    "filing.file",
    "reports.view",
    "dv.manage",
    "team.manage",
    "settings.manage",
    "audit.view",
    "data_requests.manage",
  ],
  operator: [
    "applications.view",
    "applications.view_sensitive",
    "applications.assign",
    "applications.transition",
    "photos.review",
    "filing.file",
    "reports.view",
    "audit.view",
  ],
  accountant: ["applications.view", "payments.view", "payments.reconcile", "payments.refund", "reports.view"],
  viewer: ["applications.view", "payments.view", "reports.view"],
  client: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Navigation visible to a role. The server still enforces each page. */
export const ADMIN_NAV: Array<{
  href: string;
  labelKey: string;
  permission: Permission;
  group: "operations" | "finance" | "administration";
}> = [
  { href: "/admin", labelKey: "overview", permission: "applications.view", group: "operations" },
  { href: "/admin/applications", labelKey: "applications", permission: "applications.view", group: "operations" },
  { href: "/admin/review", labelKey: "review", permission: "applications.view", group: "operations" },
  { href: "/admin/photos", labelKey: "photos", permission: "photos.review", group: "operations" },
  { href: "/admin/filing", labelKey: "filing", permission: "filing.file", group: "operations" },
  { href: "/admin/payments", labelKey: "payments", permission: "payments.view", group: "finance" },
  {
    href: "/admin/payments/reconciliation",
    labelKey: "reconciliation",
    permission: "payments.reconcile",
    group: "finance",
  },
  { href: "/admin/reports", labelKey: "reports", permission: "reports.view", group: "finance" },
  { href: "/admin/dv-years", labelKey: "dvYears", permission: "dv.manage", group: "finance" },
  { href: "/admin/team", labelKey: "team", permission: "team.manage", group: "administration" },
  { href: "/admin/audit", labelKey: "audit", permission: "audit.view", group: "administration" },
  { href: "/admin/data-requests", labelKey: "dataRequests", permission: "data_requests.manage", group: "administration" },
  { href: "/admin/settings", labelKey: "settings", permission: "settings.manage", group: "administration" },
  {
    href: "/admin/launch-checklist",
    labelKey: "launchChecklist",
    permission: "settings.manage",
    group: "administration",
  },
];
