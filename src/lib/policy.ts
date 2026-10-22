/** Version of the published legal documents. Bump when copy changes. */
export const POLICY_VERSION = "2026-10-draft";

/** Contact address shown in legal copy; must match the configured controller. */
export const LEGAL_CONTROLLER = "N.Sh. Green Card Kosova";

/** Data retention defaults. 0 means "pending approval" and is surfaced on the launch checklist. */
export const RETENTION_MONTHS = {
  applications: 24,
  photos: 12,
  paymentRecords: 84,
  auditLogs: 60,
  notifications: 12,
} as const;

export const MIN_APPLICANT_AGE = 18;
