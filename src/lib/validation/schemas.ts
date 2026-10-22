import { z } from "zod";
import { POLICY_VERSION } from "@/lib/policy";
import { isDerivativeChild } from "@/lib/pricing/calculate-tier";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
  }, "Invalid or future date");

export const personSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional().default(""),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: isoDate,
  gender: z.enum(["male", "female"]),
  birthCity: z.string().trim().min(1).max(120),
  birthCountry: z.string().trim().length(2),
  eligibilityCountry: z.string().trim().max(2).optional().default(""),
  nationality: z.string().trim().max(2).optional().default(""),
  education: z
    .enum(["none", "high_school", "university", "masters", "doctorate"])
    .optional(),
});

export const childSchema = personSchema.extend({
  id: z.string().min(1).max(80),
  married: z.boolean(),
  livesWithApplicant: z.boolean(),
  isStepchild: z.boolean(),
});

export const contactSchema = z.object({
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(6).max(40),
  addressLine1: z.string().trim().min(1).max(160),
  addressLine2: z.string().trim().max(160).default(""),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(24).default(""),
  country: z.string().trim().length(2),
  preferredLocale: z.enum(["sq", "en"]),
});

export const householdSchema = z.object({
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated"]),
  spouseIncluded: z.boolean(),
  spouseExclusionReason: z.string().trim().max(300).default(""),
  declaredChildren: z.number().int().min(0).max(15),
});

export const consentSchema = z.object({
  type: z.enum(["terms", "privacy", "immediate_performance", "accuracy", "independent_service", "guardian"]),
  policyVersion: z.string().min(1).max(40),
  acceptedAt: z.string().min(1),
  locale: z.enum(["sq", "en"]),
  memberId: z.string().optional(),
});

export const photoRefSchema = z.object({
  id: z.string().min(1),
  memberKey: z.string().min(1),
  storageKey: z.string().min(1),
  status: z.enum(["pending", "valid", "invalid", "approved", "rejected"]),
  bytes: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  contentType: z.string().min(1),
});

export const applicationSubmitSchema = z
  .object({
    household: householdSchema,
    applicant: personSchema,
    spouse: personSchema.nullable(),
    children: z.array(childSchema).max(15),
    contact: contactSchema,
    consents: z.array(consentSchema),
    photos: z.array(photoRefSchema).max(20),
    paymentMethod: z.enum(["cash", "card"]),
    policyVersion: z.string().min(1).max(40),
    draftId: z.string().uuid().optional(),
    draftSecret: z.string().min(20).max(96).optional(),
  })
  .superRefine((value, ctx) => {
    const issue = (path: string[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (value.policyVersion !== POLICY_VERSION) {
      issue(["policyVersion"], "The legal documents changed. Reload and accept the current version.");
    }
    for (const consent of value.consents) {
      if (consent.policyVersion !== POLICY_VERSION) {
        issue(["consents"], "A consent was accepted against an outdated policy version.");
      }
    }

    const { household, spouse, children } = value;
    if (household.spouseIncluded && household.maritalStatus !== "married") {
      issue(["household", "spouseIncluded"], "A spouse can only be included in a married application.");
    }
    if (household.maritalStatus === "married" && household.spouseIncluded && !spouse) {
      issue(["spouse"], "Spouse details are required when the spouse is included.");
    }
    if (
      household.maritalStatus === "married" &&
      !household.spouseIncluded &&
      household.spouseExclusionReason.trim().length < 3
    ) {
      issue(["household", "spouseExclusionReason"], "Explain why the spouse is excluded.");
    }
    if (household.declaredChildren !== children.length) {
      issue(["children"], "The child records do not match the declared number of children.");
    }
    const ids = new Set(children.map((child) => child.id));
    if (ids.size !== children.length) {
      issue(["children"], "Child identifiers must be unique.");
    }
    const entryDate = new Date().toISOString().slice(0, 10);
    for (const [index, child] of children.entries()) {
      if (!isDerivativeChild(child, entryDate)) {
        issue(["children", String(index), "dateOfBirth"], "The child must be unmarried and under 21 on the entry date.");
      }
    }
    const members = value.photos.map((photo) => photo.memberKey);
    if (new Set(members).size !== members.length) {
      issue(["photos"], "Only one photo per household member is allowed.");
    }
  });

export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;

export const magicRequestSchema = z.object({
  email: z.string().trim().email().max(180),
  locale: z.enum(["sq", "en"]).default("sq"),
});

export const noteSchema = z.object({
  applicationId: z.string().min(1),
  message: z.string().trim().min(2).max(2000),
  visibility: z.enum(["internal", "client"]).default("internal"),
});
