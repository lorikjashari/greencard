import "server-only";

import { applicationSubmitSchema, type ApplicationSubmitInput } from "@/lib/validation/schemas";
import { resolveTier } from "@/lib/pricing/calculate-tier";
import { tierWarningText } from "@/messages/tier-warnings";
import { getSettings } from "@/lib/repo/settings";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import {
  addActivity,
  createApplication,
  findPotentialDuplicates,
  getApplication,
  getApplicationByDraftId,
  updateApplication,
} from "@/lib/repo/applications";
import { createOrder, attachProviderRef, getOrderForApplication } from "@/lib/repo/orders";
import { createMagicToken } from "@/lib/repo/tokens";
import { markDraftSubmitted, authorizeDraft } from "@/lib/repo/drafts";
import { queueEmail } from "@/lib/notifications/service";
import { getBlobStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import { cardPaymentsEnabled, getPublicConfig, isDemoMode } from "@/lib/config";
import { getPaymentProvider } from "@/lib/payments/stripe";
import { checkEligibility } from "@/lib/dv/eligibility";
import { pick } from "@/lib/i18n";
import type { ApplicationRecord, ConsentRecord, PhotoRecord } from "@/lib/types";

export interface SubmitResult {
  ok: true;
  application: ApplicationRecord;
  portalLink: string | null;
  checkoutUrl: string | null;
  warnings: string[];
}

export interface SubmitFailure {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Serialises submissions for one draft within this server instance. Firestore
 * deployments still need a transaction/unique claim for multi-instance safety;
 * this closes the common double-click and network-retry window in demo and
 * single-instance deployments.
 */
const inFlightDrafts = new Set<string>();

export async function submitApplication(
  raw: unknown,
  meta: { draftId?: string; draftSecret?: string; locale: "sq" | "en" },
): Promise<SubmitResult | SubmitFailure> {
  if (meta.draftId && inFlightDrafts.has(meta.draftId)) {
    return {
      ok: false,
      error: pick(meta.locale, "Dorëzimi është duke u përpunuar. Prit dhe provo përsëri.", "The submission is already being processed. Wait and try again."),
    };
  }
  if (meta.draftId) inFlightDrafts.add(meta.draftId);
  try {
    return await submitApplicationInner(raw, meta);
  } finally {
    if (meta.draftId) inFlightDrafts.delete(meta.draftId);
  }
}

async function submitApplicationInner(
  raw: unknown,
  meta: { draftId?: string; draftSecret?: string; locale: "sq" | "en" },
): Promise<SubmitResult | SubmitFailure> {
  const parsed = applicationSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, error: "Të dhënat nuk janë të plota ose të vlefshme.", fieldErrors };
  }

  const input: ApplicationSubmitInput = parsed.data;
  const settings = await getSettings();
  const dvYear = await getActiveDvYear();
  const cardEnabled = cardPaymentsEnabled();

  if (input.paymentMethod === "card" && !cardEnabled) {
    return { ok: false, error: "Pagesa me kartë nuk është e aktivizuar." };
  }

  // Household answers are the only source of the tier. Anything the browser
  // might have displayed is ignored.
  const tier = resolveTier(
    {
      maritalStatus: input.household.maritalStatus,
      spouseIncluded: input.household.spouseIncluded,
      children: input.children.map((child) => ({
        dateOfBirth: child.dateOfBirth,
        married: child.married,
      })),
      entryDate: new Date().toISOString().slice(0, 10),
    },
    { prices: settings.prices, rulesVersion: settings.pricingRulesVersion },
  );

  if (!tier.tier || tier.priceCents === null) {
    return { ok: false, error: "Paketa nuk mund të përcaktohet nga përgjigjet e dhëna." };
  }

  const requiredMembers = ["applicant"];
  if (input.household.spouseIncluded) requiredMembers.push("spouse");
  for (const child of input.children) requiredMembers.push(`child:${child.id}`);

  const draft =
    meta.draftId && meta.draftSecret ? await authorizeDraft(meta.draftId, meta.draftSecret) : null;
  if (!draft) {
    return { ok: false, error: "Drafti nuk u gjet ose sesioni ka skaduar. Rifresko faqen dhe provo përsëri." };
  }

  // A retry after a lost response must return the already-created case rather
  // than creating a second application for the same draft. The draft claim is
  // the primary check; the durable draftId on the application also recovers a
  // case created after a crash but before the draft was claimed.
  let existing = draft.submittedApplicationId
    ? await getApplication(draft.submittedApplicationId)
    : null;
  if (!existing && draft.id) existing = await getApplicationByDraftId(draft.id);
  if (existing) {
    let existingOrder = await getOrderForApplication(existing.id);
    if (!existingOrder) {
      // Recover from a failed first attempt between application creation and
      // order creation, instead of leaving the case unusable.
      try {
        existingOrder = await createOrder({
          applicationId: existing.id,
          amountCents: existing.amountCents,
          method: input.paymentMethod,
          pricingRulesVersion: existing.pricingRulesVersion,
          provider: input.paymentMethod === "cash" ? "cash" : "stripe",
          deadlineDays: settings.cashDeadlineDays,
        });
      } catch (error) {
        console.error("[submission] order recovery failed", (error as Error).message);
        return {
          ok: false,
          error: pick(
            input.contact.preferredLocale,
            "Aplikimi ekziston, por pagesa nuk u inicializua. Kontakto zyrën me referencën e aplikimit përpara se të paguash.",
            "The application exists, but payment was not initialised. Contact the office with your application reference before paying.",
          ),
        };
      }
    }
    await markDraftSubmitted(draft.id, existing.id);

    const config = getPublicConfig();
    const token = await createMagicToken({
      email: existing.contact.email,
      purpose: "portal",
      applicationId: existing.id,
      ttlMinutes: 30,
    });
    const link = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${existing.contact.preferredLocale}&kind=portal`;
    return {
      ok: true,
      application: { ...existing, paymentStatus: existingOrder.status },
      portalLink: isDemoMode() ? link : null,
      checkoutUrl: null,
      warnings: [
        pick(
          input.contact.preferredLocale,
          "Ky draft është dorëzuar më parë. Po shfaqim aplikimin ekzistues; nuk u krijua një dublikatë.",
          "This draft was submitted earlier. Showing the existing application; no duplicate was created.",
        ),
      ],
    };
  }

  const photosByMember = new Map(input.photos.map((photo) => [photo.memberKey, photo]));
  if (input.photos.length !== requiredMembers.length) {
    return { ok: false, error: "Numri i fotografive nuk përputhet me anëtarët e aplikimit." };
  }
  for (const member of requiredMembers) {
    const photo = photosByMember.get(member);
    if (!photo) {
      return { ok: false, error: `Mungon fotografia për ${member}.` };
    }
    if (photo.status === "invalid") {
      return { ok: false, error: `Fotografia për ${member} ka probleme dhe duhet zëvendësuar.` };
    }
    const draftPhoto = draft.data.photos[member];
    if (!draftPhoto || draftPhoto.storageKey !== photo.storageKey) {
      return { ok: false, error: "Fotografia nuk përputhet me draftin e ruajtur. Ngarko përsëri." };
    }
  }

  // Verify the uploaded bytes exist and belong to this draft.
  const blobs = getBlobStore();
  const scope = draft.id;
  for (const photo of input.photos) {
    if (!photo.storageKey.startsWith(`photos/${scope}/`)) {
      return { ok: false, error: "Fotografia nuk i përket këtij aplikimi." };
    }
    const stored = await blobs.get(photo.storageKey);
    if (!stored) {
      return { ok: false, error: "Një nga fotografitë nuk u gjet në ruajtje. Ngarko përsëri." };
    }
  }

  const requiredConsents = [
    "terms",
    "privacy",
    "immediate_performance",
    "accuracy",
    "independent_service",
  ];
  if (input.children.length > 0) requiredConsents.push("guardian");
  const consentTypes = new Set(input.consents.map((consent) => consent.type));
  for (const required of requiredConsents) {
    if (!consentTypes.has(required as ConsentRecord["type"])) {
      return { ok: false, error: `Mungon pranimi: ${required}.` };
    }
  }

  const duplicates = await findPotentialDuplicates({
    firstName: input.applicant.firstName,
    lastName: input.applicant.lastName,
    dateOfBirth: input.applicant.dateOfBirth,
  });

  const eligibility = checkEligibility(
    {
      birthCountry: input.applicant.eligibilityCountry || input.applicant.birthCountry,
      education: input.applicant.education,
    },
    dvYear,
  );

  // A hard eligibility failure must stop before creating an order or taking
  // money. Soft warnings remain visible to staff for manual review.
  if (eligibility.blockers.length > 0) {
    return {
      ok: false,
      error: pick(
        input.contact.preferredLocale,
        "Aplikimi nuk plotëson kushtet bazë të programit DV sipas konfigurimit aktual. Kontakto zyrën para se të vazhdosh.",
        "The application does not meet the basic DV programme requirements under the current configuration. Contact the office before continuing.",
      ),
      fieldErrors: {
        [input.applicant.eligibilityCountry ? "applicant.eligibilityCountry" : "applicant.birthCountry"]:
          eligibility.blockers[0],
      },
    };
  }

  const acceptedAt = nowIso();
  const consents: ConsentRecord[] = input.consents.map((consent) => ({
    type: consent.type,
    policyVersion: consent.policyVersion,
    acceptedAt,
    locale: input.contact.preferredLocale,
    memberId: consent.memberId,
  }));

  // Photo metadata comes from the server-side draft, never from the browser.
  // Client-supplied "approved" states are ignored.
  const photos: PhotoRecord[] = input.photos.map((photo) => {
    const stored = draft.data.photos[photo.memberKey];
    return {
      id: stored.id,
      memberKey: photo.memberKey,
      memberName: memberNameFor(input, photo.memberKey),
      storageKey: stored.storageKey,
      originalName: stored.originalName,
      contentType: stored.contentType,
      bytes: stored.bytes,
      width: stored.width,
      height: stored.height,
      status: stored.status === "invalid" ? "invalid" : "valid",
      issues: stored.issues,
      rulesVersion: stored.rulesVersion,
      uploadedAt: stored.uploadedAt,
    };
  });

  const application = await createApplication({
    draftId: draft.id,
    dvYear: dvYear.year,
    locale: input.contact.preferredLocale ?? meta.locale,
    packageKey: tier.tier,
    amountCents: tier.priceCents,
    pricingRulesVersion: tier.rulesVersion,
    household: input.household,
    applicant: {
      ...input.applicant,
      education: input.applicant.education,
    },
    spouse:
      input.household.maritalStatus === "married" && input.household.spouseIncluded
        ? input.spouse
        : null,
    children: input.children,
    contact: input.contact,
    consents,
    photos,
    isDemo: isDemoMode(),
  });

  await updateApplication(application.id, {
    duplicate: {
      level: duplicates.level,
      matches: duplicates.matches,
      checkedAt: new Date().toISOString(),
    },
    statusReason: [...eligibility.blockers, ...eligibility.warnings].join(" | ") || undefined,
    completeness: {
      ...application.completeness,
      dataComplete: application.completeness.dataComplete && eligibility.blockers.length === 0,
      missing: [
        ...application.completeness.missing,
        ...eligibility.blockers.map((blocker) => `eligibility:${blocker}`),
      ],
    },
  });

  const order = await createOrder({
    applicationId: application.id,
    amountCents: application.amountCents,
    method: input.paymentMethod,
    pricingRulesVersion: tier.rulesVersion,
    provider: input.paymentMethod === "cash" ? "cash" : "stripe",
    deadlineDays: settings.cashDeadlineDays,
  });

  if (tier.needsReview || tier.pendingPolicy.length > 0) {
    await addActivity({
      applicationId: application.id,
      type: "note",
      actorId: null,
      actorName: "System",
      visibility: "internal",
      message:
        `Pricing policy review required before filing. ` +
        `Pending: ${tier.pendingPolicy.join(", ") || "none"}. ` +
        `Warnings: ${tier.warnings.map((warning) => warning.code).join(", ") || "none"}.`,
    });
  }

  // Claim the draft immediately after the order exists. A retry from here on
  // returns the existing case rather than creating another one.
  if (meta.draftId && meta.draftSecret) {
    await markDraftSubmitted(meta.draftId, application.id);
  }

  let checkoutUrl: string | null = null;
  if (input.paymentMethod === "card") {
    const provider = getPaymentProvider();
    if (!provider) {
      return {
        ok: false,
        error: pick(
          input.contact.preferredLocale,
          "Pagesa me kartë nuk është e disponueshme. Asnjë pagesë nuk u iniciua.",
          "Card payment is not available. No payment was started.",
        ),
      };
    }
    try {
      const checkout = await provider.createCheckout({
        order,
        application,
        locale: input.contact.preferredLocale,
      });
      await attachProviderRef(order.id, checkout.providerRef);
      checkoutUrl = checkout.url;
    } catch (error) {
      // The application and a pending card order exist at this point. Do not
      // pretend the payment started; surface a warning and let the client use
      // the portal/support while staff reconcile the pending order.
      console.error("[payments] checkout creation failed", (error as Error).message);
    }
  }

  const config = getPublicConfig();
  const token = await createMagicToken({
    email: input.contact.email,
    purpose: "portal",
    applicationId: application.id,
    ttlMinutes: 30,
  });
  const portalLink = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${input.contact.preferredLocale}&kind=portal`;

  const name = input.applicant.firstName;
  const tierLabel = pick(
    input.contact.preferredLocale,
    `Aplikim ${tier.tier === "individual" ? "Individual" : tier.tier === "couple" ? "për Çifte" : "Familjar"}`,
    tier.tier === "individual" ? "Individual Application" : tier.tier === "couple" ? "Couple Application" : "Family Application",
  );

  await queueEmail({
    to: input.contact.email,
    type: "application_submitted",
    locale: input.contact.preferredLocale,
    applicationId: application.id,
    dedupeKey: `submitted:${application.id}`,
    context: { name, reference: application.ref, link: portalLink, tierLabel },
  });

  if (input.paymentMethod === "cash") {
    const cashToken = await createMagicToken({
      email: input.contact.email,
      purpose: "portal",
      applicationId: application.id,
      ttlMinutes: 30,
    });
    const cashLink = `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(cashToken)}&locale=${input.contact.preferredLocale}&kind=portal`;
    await queueEmail({
      to: input.contact.email,
      type: "cash_instructions",
      locale: input.contact.preferredLocale,
      applicationId: application.id,
      dedupeKey: `cash-instructions:${order.id}`,
      context: {
        name,
        reference: application.ref,
        link: cashLink,
        amountCents: application.amountCents,
        message: input.contact.preferredLocale === "sq" ? settings.cashInstructionsSq : settings.cashInstructionsEn,
      },
    });
  }

  return {
    ok: true,
    application: { ...application, paymentStatus: order.status },
    portalLink: isDemoMode() ? portalLink : null,
    checkoutUrl,
    warnings: [
      ...(input.paymentMethod === "card" && !checkoutUrl
        ? [
            pick(
              input.contact.preferredLocale,
              "Pagesa me kartë nuk u nis. Aplikimi u ruajt; kontakto stafin përmes portalit.",
              "Card payment did not start. The application was saved; contact staff through the portal.",
            ),
          ]
        : []),
      ...tier.warnings.map((warning) => tierWarningText(input.contact.preferredLocale, warning)),
      ...eligibility.warnings,
    ],
  };
}

function memberNameFor(input: ApplicationSubmitInput, memberKey: string): string {
  if (memberKey === "applicant") return `${input.applicant.firstName} ${input.applicant.lastName}`.trim();
  if (memberKey === "spouse") {
    return input.spouse ? `${input.spouse.firstName} ${input.spouse.lastName}`.trim() : "";
  }
  const id = memberKey.replace("child:", "");
  const child = input.children.find((candidate) => candidate.id === id);
  return child ? `${child.firstName} ${child.lastName}`.trim() : "";
}
