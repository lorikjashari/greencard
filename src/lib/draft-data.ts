import type { ContactData, DraftData, PersonData } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function emptyPerson(): PersonData {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    birthCity: "",
    birthCountry: "",
    eligibilityCountry: "",
    nationality: "",
    education: undefined,
  };
}

export function emptyContact(locale: Locale): ContactData {
  return {
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    preferredLocale: locale,
  };
}

export function emptyDraftData(locale: Locale): DraftData {
  return {
    household: {
      maritalStatus: "",
      spouseIncluded: false,
      spouseExclusionReason: "",
      declaredChildren: 0,
    },
    applicant: emptyPerson(),
    spouse: emptyPerson(),
    children: [],
    contact: emptyContact(locale),
    photos: {},
    consents: {},
    paymentMethod: "cash",
  };
}

export function isDraftData(value: unknown): value is DraftData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.applicant === "object" &&
    typeof candidate.contact === "object" &&
    typeof candidate.household === "object" &&
    Array.isArray(candidate.children)
  );
}
