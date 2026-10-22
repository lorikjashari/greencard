import { describe, expect, it } from "vitest";
import { emptyDraftData } from "@/lib/draft-data";
import { requiredPhotoMembers, validateAllSteps, validateStep } from "./wizard";
import type { DraftData, PhotoRecord } from "@/lib/types";

function photo(): PhotoRecord {
  return {
    id: "photo-1",
    memberKey: "applicant",
    memberName: "Test Applicant",
    storageKey: "photos/draft-1/applicant.jpg",
    originalName: "photo.jpg",
    contentType: "image/jpeg",
    bytes: 1000,
    width: 600,
    height: 600,
    status: "approved",
    issues: [],
    rulesVersion: "2027.1",
    uploadedAt: "2026-10-01T00:00:00.000Z",
  };
}

function validData(): DraftData {
  const data = emptyDraftData("en");
  data.household = {
    maritalStatus: "single",
    spouseIncluded: false,
    spouseExclusionReason: "",
    declaredChildren: 0,
  };
  data.applicant = {
    firstName: "Ada",
    middleName: "",
    lastName: "Krasniqi",
    dateOfBirth: "1992-04-12",
    gender: "female",
    birthCity: "Prishtina",
    birthCountry: "XK",
    nationality: "XK",
    education: "university",
  };
  data.contact = {
    email: "ada@example.com",
    phone: "+383 44 123 456",
    addressLine1: "Rr. Test 1",
    addressLine2: "",
    city: "Prishtina",
    postalCode: "10000",
    country: "XK",
    preferredLocale: "en",
  };
  data.photos = { applicant: photo() };
  data.consents = {
    terms: true,
    privacy: true,
    immediatePerformance: true,
    accuracy: true,
    independentService: true,
  };
  data.paymentMethod = "cash";
  return data;
}

describe("wizard validation", () => {
  it("requires marital status on step 1", () => {
    const data = emptyDraftData("en");
    const errors = validateStep(1, data, "en", { cardEnabled: false });
    expect(errors["household.maritalStatus"]).toBeTruthy();
  });

  it("requires an exclusion reason when a married applicant excludes the spouse", () => {
    const data = emptyDraftData("en");
    data.household.maritalStatus = "married";
    data.household.spouseIncluded = false;
    data.household.spouseExclusionReason = "";
    data.household.declaredChildren = 0;
    const errors = validateStep(1, data, "en", { cardEnabled: false });
    expect(errors["household.spouseExclusionReason"]).toBeTruthy();
  });

  it("accepts a valid single applicant household", () => {
    const errors = validateStep(1, validData(), "en", { cardEnabled: false });
    expect(errors).toEqual({});
  });

  it("rejects a child count that does not match the household answer", () => {
    const data = validData();
    data.household.declaredChildren = 2;
    const errors = validateStep(4, data, "en", { cardEnabled: false });
    expect(errors["children.count"]).toBeTruthy();
  });

  it("validates contact details", () => {
    const data = validData();
    data.contact.email = "not-an-email";
    data.contact.phone = "12";
    const errors = validateStep(5, data, "en", { cardEnabled: false });
    expect(errors["contact.email"]).toBeTruthy();
    expect(errors["contact.phone"]).toBeTruthy();
  });

  it("requires a photo for each family member in the application", () => {
    const data = validData();
    data.photos = {};
    const errors = validateStep(6, data, "en", { cardEnabled: false });
    expect(errors["photo.applicant"]).toBeTruthy();
  });

  it("includes spouse and children in required photo members", () => {
    const data = validData();
    data.household.maritalStatus = "married";
    data.household.spouseIncluded = true;
    data.children = [
      {
        id: "child-1",
        firstName: "Kid",
        middleName: "",
        lastName: "Krasniqi",
        dateOfBirth: "2015-01-01",
        gender: "male",
        birthCity: "Prishtina",
        birthCountry: "XK",
        married: false,
        livesWithApplicant: true,
        isStepchild: false,
      },
    ];
    expect(requiredPhotoMembers(data)).toEqual(["applicant", "spouse", "child:child-1"]);
  });

  it("requires all consents, including guardian consent with children", () => {
    const data = validData();
    data.consents = {};
    data.children = [
      {
        id: "child-1",
        firstName: "Kid",
        middleName: "",
        lastName: "Krasniqi",
        dateOfBirth: "2015-01-01",
        gender: "male",
        birthCity: "Prishtina",
        birthCountry: "XK",
        married: false,
        livesWithApplicant: true,
        isStepchild: false,
      },
    ];
    const errors = validateStep(7, data, "en", { cardEnabled: false });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["consents.terms", "consents.privacy", "consents.guardian"]),
    );
  });

  it("blocks card payment when no provider is configured", () => {
    const data = validData();
    data.paymentMethod = "card";
    const errors = validateStep(8, data, "en", { cardEnabled: false });
    expect(errors["paymentMethod"]).toBeTruthy();
  });

  it("rejects a child who is married or 21 or older", () => {
    const data = validData();
    data.household.declaredChildren = 2;
    data.children = [
      {
        id: "child-old",
        firstName: "Older",
        middleName: "",
        lastName: "Krasniqi",
        dateOfBirth: "2000-01-01",
        gender: "male",
        birthCity: "Prishtina",
        birthCountry: "XK",
        married: false,
        livesWithApplicant: true,
        isStepchild: false,
      },
      {
        id: "child-married",
        firstName: "Married",
        middleName: "",
        lastName: "Krasniqi",
        dateOfBirth: "2015-01-01",
        gender: "female",
        birthCity: "Prishtina",
        birthCountry: "XK",
        married: true,
        livesWithApplicant: true,
        isStepchild: false,
      },
    ];
    const errors = validateStep(4, data, "en", { cardEnabled: false });
    expect(errors["children.0.dateOfBirth"]).toBeTruthy();
    expect(errors["children.1.dateOfBirth"]).toBeTruthy();
  });

  it("rejects an unknown optional eligibility country", () => {
    const data = validData();
    data.applicant.eligibilityCountry = "ZZ";
    const errors = validateStep(2, data, "en", { cardEnabled: false });
    expect(errors["applicant.eligibilityCountry"]).toBeTruthy();
  });

  it("passes all steps for a complete single-applicant case", () => {
    expect(validateAllSteps(validData(), "en", { cardEnabled: false })).toEqual({});
  });

  it("localises errors in Albanian and English", () => {
    const data = emptyDraftData("sq");
    const sq = validateStep(1, data, "sq", { cardEnabled: false });
    const en = validateStep(1, data, "en", { cardEnabled: false });
    expect(sq["household.maritalStatus"]).not.toBe(en["household.maritalStatus"]);
  });
});
