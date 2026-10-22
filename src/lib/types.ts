/**
 * Shared domain types.
 *
 * These are transport-agnostic: the same records are used by the demo
 * (file) store and the Firestore adapter, so business logic never depends
 * on which backend is active.
 */

export type Locale = "sq" | "en";

export type Role = "admin" | "operator" | "accountant" | "viewer" | "client";

export type PackageKey = "individual" | "couple" | "family";

export type MaritalStatus = "single" | "married" | "divorced" | "widowed" | "separated";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_information"
  | "ready_to_file"
  | "filed"
  | "confirmation_sent"
  | "selected"
  | "not_selected"
  | "cancelled"
  | "expired"
  | "rejected";

export type PaymentStatus =
  | "created"
  | "pending_cash"
  | "pending_card"
  | "paid"
  | "refunded"
  | "disputed"
  | "expired"
  | "failed";

export type PhotoStatus = "pending" | "valid" | "invalid" | "approved" | "rejected";

export type PaymentMethod = "cash" | "card";

export type EducationLevel =
  | "none"
  | "high_school"
  | "university"
  | "masters"
  | "doctorate";

export interface PersonData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: "male" | "female" | "";
  birthCity: string;
  birthCountry: string; // ISO alpha-2
  /** DV country of eligibility/chargeability when it differs from birth country. */
  eligibilityCountry?: string; // ISO alpha-2
  nationality?: string;
  education?: EducationLevel;
  maritalStatus?: MaritalStatus;
}

export interface ChildData extends PersonData {
  id: string;
  married: boolean;
  livesWithApplicant: boolean;
  isStepchild: boolean;
}

export interface ContactData {
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  preferredLocale: Locale;
}

export interface HouseholdData {
  maritalStatus: MaritalStatus | "";
  spouseIncluded: boolean;
  spouseExclusionReason: string;
  declaredChildren: number;
}

export interface ConsentRecord {
  type:
    | "terms"
    | "privacy"
    | "immediate_performance"
    | "accuracy"
    | "independent_service"
    | "guardian";
  policyVersion: string;
  acceptedAt: string;
  locale: Locale;
  /** Which child the guardian consent applies to (guardian consent only). */
  memberId?: string;
}

export interface PhotoIssue {
  code: string;
  messageSq: string;
  messageEn: string;
  severity: "error" | "warning";
}

export interface PhotoRecord {
  id: string;
  memberKey: string; // applicant | spouse | child:<id>
  memberName: string;
  storageKey: string;
  originalName: string;
  contentType: string;
  bytes: number;
  width: number;
  height: number;
  status: PhotoStatus;
  issues: PhotoIssue[];
  rulesVersion: string;
  uploadedAt: string;
  /** Short-lived preview URL produced at upload time; never used for access control. */
  previewUrl?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface DuplicateCheck {
  level: "none" | "warn" | "block";
  matches: string[];
  checkedAt: string;
}

export interface ApplicationRecord {
  id: string;
  ref: string;
  /** Durable link to the originating draft, used for submission idempotency. */
  draftId?: string | null;
  dvYear: number;
  locale: Locale;
  status: ApplicationStatus;
  /** Denormalised cache of the authoritative order status, for list views. */
  paymentStatus: PaymentStatus;
  packageKey: PackageKey;
  amountCents: number;
  currency: "EUR";
  pricingRulesVersion: string;

  household: HouseholdData;
  applicant: PersonData;
  spouse: PersonData | null;
  children: ChildData[];
  contact: ContactData;

  consents: ConsentRecord[];
  photos: PhotoRecord[];
  completeness: Completeness;

  duplicate: DuplicateCheck;
  statusReason?: string;
  assigneeId: string | null;
  ownerEmail: string | null;
  claimedByUid: string | null;

  isDemo: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: "public" | "staff";
  source?: { utmSource?: string; utmCampaign?: string; fbclid?: string };
}

export interface Completeness {
  dataComplete: boolean;
  photosApproved: boolean;
  missing: string[];
}

export interface OrderRecord {
  id: string;
  applicationId: string;
  ref: string;
  amountCents: number;
  currency: "EUR";
  method: PaymentMethod;
  status: PaymentStatus;
  pricingRulesVersion: string;
  provider: "cash" | "stripe" | "disabled";
  providerRef: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  expiresAt: string | null;
  receivedBy?: string | null;
  receivedAt?: string | null;
  receivedAmountCents?: number | null;
  receivingMethod?: "post" | "office" | "bank" | null;
  evidenceNote?: string | null;
  amountMismatch?: boolean;
  mismatchReviewedAt?: string | null;
  mismatchReviewedBy?: string | null;
  mismatchReviewNote?: string | null;
  refundedAt?: string | null;
  refundReason?: string | null;
}

export interface PaymentEventRecord {
  id: string;
  orderId: string;
  applicationId: string;
  type:
    | "created"
    | "cash_pending"
    | "card_pending"
    | "paid"
    | "refunded"
    | "disputed"
    | "failed"
    | "expired"
    | "note";
  amountCents: number;
  actorType: "system" | "staff" | "provider" | "client";
  actorId: string | null;
  note: string | null;
  createdAt: string;
  idempotencyKey?: string | null;
}

export interface FilingRecord {
  id: string;
  applicationId: string;
  dvYear: number;
  confirmationNumber: string;
  filedAt: string;
  filedBy: string;
  notes: string | null;
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  applicationId: string;
  type:
    | "created"
    | "submitted"
    | "status_changed"
    | "note"
    | "photo_uploaded"
    | "photo_approved"
    | "photo_rejected"
    | "payment_pending"
    | "payment_paid"
    | "payment_refunded"
    | "filed"
    | "confirmation_queued"
    | "info_requested"
    | "client_message"
    | "edit_requested"
    | "assigned";
  actorId: string | null;
  actorName: string;
  visibility: "internal" | "client";
  message: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  invitedBy?: string | null;
  firebaseUid?: string | null;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  applicationId: string | null;
  type: string;
  channel: "email";
  to: string;
  locale: Locale;
  subject: string;
  status: "queued" | "sent" | "failed" | "not_configured";
  provider: string;
  providerMessageId: string | null;
  error: string | null;
  bodyPreview: string;
  createdAt: string;
  sentAt: string | null;
  dedupeKey: string;
}

export interface DvYearRecord {
  id: string;
  year: number;
  opensAt: string;
  closesAt: string;
  instructionsUrl: string;
  photoRulesVersion: string;
  active: boolean;
  eligibleCountries: string[] | null;
  notes: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DraftRecord {
  id: string;
  /** SHA-256 of the draft secret held by the browser. */
  secretHash: string;
  locale: Locale;
  step: number;
  version: number;
  data: DraftData;
  contactEmail: string | null;
  submittedApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DraftData {
  household: HouseholdData;
  applicant: PersonData;
  spouse: PersonData;
  children: ChildData[];
  contact: ContactData;
  photos: Record<string, PhotoRecord>;
  consents: Record<string, boolean>;
  paymentMethod: PaymentMethod;
}

export interface MagicTokenRecord {
  id: string;
  tokenHash: string;
  email: string;
  purpose: "portal" | "resume" | "staff";
  applicationId?: string | null;
  draftId?: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface EditRequestRecord {
  id: string;
  applicationId: string;
  message: string;
  status: "open" | "resolved" | "declined";
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface DataRequestRecord {
  id: string;
  applicationId: string | null;
  email: string;
  type: "access" | "correction" | "deletion";
  message: string;
  status: "open" | "in_progress" | "completed" | "declined";
  createdAt: string;
  completedAt: string | null;
  handledBy: string | null;
  notes: string | null;
}

export interface SystemSettings {
  id: string;
  pricingRulesVersion: string;
  prices: Record<PackageKey, number>;
  cashInstructionsSq: string;
  cashInstructionsEn: string;
  cashDeadlineDays: number;
  postSelectionFeeEnabled: boolean | null; // null = unresolved launch blocker
  postSelectionFeeCents: number | null;
  singleParentPricingApproved: boolean;
  spouseExclusionPricingApproved: boolean;
  retentionApproved: boolean;
  legalCopyApproved: boolean;
  mfaRequired: boolean;
  sessionIdleMinutes: number;
  updatedAt: string;
  updatedBy: string;
}

export interface EmailOutboxRecord {
  id: string;
  notificationId: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  createdAt: string;
}

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
}
