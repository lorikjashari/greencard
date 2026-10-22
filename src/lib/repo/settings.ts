import "server-only";

import { getStore } from "@/lib/store";
import { DEFAULT_PRICES, DEFAULT_PRICING_RULES_VERSION } from "@/lib/pricing/calculate-tier";
import { nowIso } from "@/lib/ids";
import type { SystemSettings } from "@/lib/types";

const SETTINGS_ID = "main";

function defaults(): SystemSettings {
  return {
    id: SETTINGS_ID,
    pricingRulesVersion: DEFAULT_PRICING_RULES_VERSION,
    prices: { ...DEFAULT_PRICES },
    cashInstructionsSq:
      "Paguaj {amount} me referencën {ref}. Stafi konfirmon procedurën dhe afatin e saktë të pagesës përpara se të paguash. Për pyetje: {phone} ose {email}.",
    cashInstructionsEn:
      "Pay {amount} using reference {ref}. Staff will confirm the exact payment procedure and deadline before you pay. Questions: {phone} or {email}.",
    cashDeadlineDays: 7,
    postSelectionFeeEnabled: null,
    postSelectionFeeCents: null,
    singleParentPricingApproved: false,
    spouseExclusionPricingApproved: false,
    retentionApproved: false,
    legalCopyApproved: false,
    mfaRequired: true,
    sessionIdleMinutes: 30,
    updatedAt: nowIso(),
    updatedBy: "system",
  };
}

let cached: SystemSettings | null = null;

export async function getSettings(): Promise<SystemSettings> {
  if (cached) return cached;
  const store = getStore();
  const existing = await store.get<SystemSettings>("systemConfig", SETTINGS_ID);
  if (existing) {
    cached = { ...defaults(), ...existing, id: SETTINGS_ID };
    return cached;
  }
  const created = defaults();
  await store.set("systemConfig", SETTINGS_ID, created);
  cached = created;
  return created;
}

export async function updateSettings(
  patch: Partial<Omit<SystemSettings, "id" | "updatedAt" | "updatedBy">>,
  actor: { uid: string; email: string },
): Promise<SystemSettings> {
  const current = await getSettings();
  const next: SystemSettings = {
    ...current,
    ...patch,
    id: SETTINGS_ID,
    updatedAt: nowIso(),
    updatedBy: actor.email,
  };
  await getStore().set("systemConfig", SETTINGS_ID, next);
  cached = next;
  return next;
}

export function renderCashInstructions(
  template: string,
  values: { amount: string; ref: string; address: string; phone: string; email: string },
): string {
  return template
    .replaceAll("{amount}", values.amount)
    .replaceAll("{ref}", values.ref)
    .replaceAll("{address}", values.address)
    .replaceAll("{phone}", values.phone)
    .replaceAll("{email}", values.email);
}

/** Test hook only. */
export function resetSettingsCache(): void {
  cached = null;
}
