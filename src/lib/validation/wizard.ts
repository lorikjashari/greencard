import { copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import type { DraftData } from "@/lib/types";
import { isKnownCountry } from "@/lib/countries";
import { isDerivativeChild } from "@/lib/pricing/calculate-tier";

export type WizardErrors = Record<string, string>;

export const TOTAL_STEPS = 8;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const [year, month, day] = value.split("-").map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day &&
    year >= 1900 &&
    date.getTime() <= Date.now()
  );
}

function personErrors(
  person: DraftData["applicant"],
  prefix: string,
  t: ReturnType<typeof copy>,
  options?: { requireEducation?: boolean },
): WizardErrors {
  const errors: WizardErrors = {};
  if (!person.firstName.trim()) errors[`${prefix}.firstName`] = t.errors.required;
  if (!person.lastName.trim()) errors[`${prefix}.lastName`] = t.errors.required;
  if (!person.dateOfBirth) errors[`${prefix}.dateOfBirth`] = t.errors.required;
  else if (!isValidDate(person.dateOfBirth)) errors[`${prefix}.dateOfBirth`] = t.errors.invalidDate;
  if (!person.gender) errors[`${prefix}.gender`] = t.errors.required;
  if (!person.birthCity.trim()) errors[`${prefix}.birthCity`] = t.errors.required;
  if (!person.birthCountry) errors[`${prefix}.birthCountry`] = t.errors.required;
  else if (!isKnownCountry(person.birthCountry)) errors[`${prefix}.birthCountry`] = t.errors.required;
  if (person.eligibilityCountry && !isKnownCountry(person.eligibilityCountry)) {
    errors[`${prefix}.eligibilityCountry`] = t.errors.required;
  }
  if (person.nationality && !isKnownCountry(person.nationality)) {
    errors[`${prefix}.nationality`] = t.errors.required;
  }
  if (options?.requireEducation && !person.education) errors[`${prefix}.education`] = t.errors.required;
  return errors;
}

export function validateStep(
  step: number,
  data: DraftData,
  locale: Locale,
  options: { cardEnabled: boolean },
): WizardErrors {
  const t = copy(locale);
  const errors: WizardErrors = {};

  if (step === 1) {
    if (!data.household.maritalStatus) errors["household.maritalStatus"] = t.errors.required;
    if (data.household.maritalStatus === "married") {
      if (!data.household.spouseIncluded && !data.household.spouseExclusionReason.trim()) {
        errors["household.spouseExclusionReason"] = t.errors.required;
      }
    }
    const count = data.household.declaredChildren;
    if (!Number.isInteger(count) || count < 0 || count > 15) {
      errors["household.declaredChildren"] = t.errors.required;
    }
  }

  if (step === 2) {
    Object.assign(errors, personErrors(data.applicant, "applicant", t, { requireEducation: true }));
  }

  if (step === 3 && data.household.maritalStatus === "married" && data.household.spouseIncluded) {
    Object.assign(errors, personErrors(data.spouse, "spouse", t));
  }

  if (step === 4) {
    if (data.children.length !== data.household.declaredChildren) {
      errors["children.count"] = t.apply.childCountMismatch;
    }
    data.children.forEach((child, index) => {
      const childErrors = personErrors(child, `children.${index}`, t);
      for (const [key, value] of Object.entries(childErrors)) errors[key] = value;
      if (child.isStepchild === undefined) errors[`children.${index}.isStepchild`] = t.errors.required;
      if (!isDerivativeChild(child, new Date().toISOString().slice(0, 10))) {
        errors[`children.${index}.dateOfBirth`] = t.apply.childIneligible;
      }
    });
  }

  if (step === 5) {
    if (!data.contact.email.trim()) errors["contact.email"] = t.errors.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.contact.email.trim())) {
      errors["contact.email"] = t.errors.invalidEmail;
    }
    if (!data.contact.phone.trim()) errors["contact.phone"] = t.errors.required;
    else if (data.contact.phone.replace(/\D/g, "").length < 6) errors["contact.phone"] = t.errors.required;
    if (!data.contact.addressLine1.trim()) errors["contact.addressLine1"] = t.errors.required;
    if (!data.contact.city.trim()) errors["contact.city"] = t.errors.required;
    if (!data.contact.country) errors["contact.country"] = t.errors.required;
  }

  if (step === 6) {
    const members = requiredPhotoMembers(data);
    for (const member of members) {
      const photo = data.photos[member];
      if (!photo) errors[`photo.${member}`] = t.apply.photoMissing;
      else if (photo.status === "invalid") errors[`photo.${member}`] = t.apply.photoInvalid;
    }
  }

  if (step === 7) {
    const required = ["terms", "privacy", "immediatePerformance", "accuracy", "independentService"];
    if (data.children.length > 0) required.push("guardian");
    for (const key of required) {
      if (!data.consents[key]) errors[`consents.${key}`] = t.errors.required;
    }
  }

  if (step === 8) {
    if (!data.paymentMethod) errors["paymentMethod"] = t.errors.required;
    if (data.paymentMethod === "card" && !options.cardEnabled) {
      errors["paymentMethod"] = t.apply.paymentCardDisabled;
    }
  }

  return errors;
}

export function requiredPhotoMembers(data: DraftData): string[] {
  const members = ["applicant"];
  if (data.household.maritalStatus === "married" && data.household.spouseIncluded) {
    members.push("spouse");
  }
  for (const child of data.children) members.push(`child:${child.id}`);
  return members;
}

export function validateAllSteps(
  data: DraftData,
  locale: Locale,
  options: { cardEnabled: boolean },
): WizardErrors {
  let all: WizardErrors = {};
  for (let step = 1; step <= TOTAL_STEPS; step += 1) {
    all = { ...all, ...validateStep(step, data, locale, options) };
  }
  return all;
}
