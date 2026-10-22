import "server-only";

import { getStore } from "@/lib/store";
import { nowIso, publicRef } from "@/lib/ids";
import type {
  ActivityRecord,
  ApplicationRecord,
  ApplicationStatus,
  ChildData,
  Completeness,
  ContactData,
  HouseholdData,
  PersonData,
  PhotoRecord,
} from "@/lib/types";

const COLLECTION = "applications";
const ACTIVITY = "activity";

export interface CreateApplicationInput {
  draftId?: string | null;
  dvYear: number;
  locale: "sq" | "en";
  packageKey: ApplicationRecord["packageKey"];
  amountCents: number;
  pricingRulesVersion: string;
  household: HouseholdData;
  applicant: PersonData;
  spouse: PersonData | null;
  children: ChildData[];
  contact: ContactData;
  consents: ApplicationRecord["consents"];
  photos: PhotoRecord[];
  isDemo: boolean;
  source?: ApplicationRecord["source"];
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normaliseName(value: string): string {
  return stripDiacritics(value).toLowerCase().replace(/[^a-z]/g, "");
}

export async function createApplication(input: CreateApplicationInput): Promise<ApplicationRecord> {
  const store = getStore();
  const now = nowIso();
  const id = crypto.randomUUID();

  let ref = publicRef();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await store.query<ApplicationRecord>(COLLECTION, {
      where: [{ field: "ref", op: "==", value: ref }],
      limit: 1,
    });
    if (clash.length === 0) break;
    ref = publicRef();
  }

  const record: ApplicationRecord = {
    id,
    ref,
    draftId: input.draftId ?? null,
    dvYear: input.dvYear,
    locale: input.locale,
    status: "submitted",
    paymentStatus: "created",
    packageKey: input.packageKey,
    amountCents: input.amountCents,
    currency: "EUR",
    pricingRulesVersion: input.pricingRulesVersion,
    household: input.household,
    applicant: input.applicant,
    spouse: input.spouse,
    children: input.children,
    contact: { ...input.contact, email: input.contact.email.trim().toLowerCase() },
    consents: input.consents,
    photos: input.photos,
    completeness: computeCompleteness({
      applicant: input.applicant,
      spouse: input.spouse,
      children: input.children,
      contact: input.contact,
      household: input.household,
      photos: input.photos,
    }),
    duplicate: { level: "none", matches: [], checkedAt: now },
    assigneeId: null,
    ownerEmail: input.contact.email.trim().toLowerCase(),
    claimedByUid: null,
    isDemo: input.isDemo,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: "public",
    source: input.source,
  };

  await store.set(COLLECTION, id, record);
  await addActivity({
    applicationId: id,
    type: "submitted",
    actorId: null,
    actorName: "Sistemi",
    visibility: "client",
    message: "Aplikimi u dorëzua nga klienti.",
  });

  return record;
}

export async function getApplication(id: string): Promise<ApplicationRecord | null> {
  return getStore().get<ApplicationRecord>(COLLECTION, id);
}

export async function getApplicationByRef(ref: string): Promise<ApplicationRecord | null> {
  const rows = await getStore().query<ApplicationRecord>(COLLECTION, {
    where: [{ field: "ref", op: "==", value: ref.trim().toUpperCase() }],
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function getApplicationByDraftId(draftId: string): Promise<ApplicationRecord | null> {
  if (!draftId) return null;
  const rows = await getStore().query<ApplicationRecord>(COLLECTION, {
    where: [{ field: "draftId", op: "==", value: draftId }],
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function listApplications(filter?: {
  dvYear?: number;
  status?: ApplicationStatus[];
  paymentStatus?: string[];
  packageKey?: string;
  needsAttention?: boolean;
  query?: string;
  assigneeId?: string;
}): Promise<ApplicationRecord[]> {
  const store = getStore();
  const base = filter?.dvYear
    ? await store.query<ApplicationRecord>(COLLECTION, {
        where: [{ field: "dvYear", op: "==", value: filter.dvYear }],
      })
    : await store.query<ApplicationRecord>(COLLECTION, {
        orderBy: [{ field: "createdAt", direction: "desc" }],
      });

  let rows = [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filter?.status?.length) rows = rows.filter((row) => filter.status!.includes(row.status));
  if (filter?.packageKey) rows = rows.filter((row) => row.packageKey === filter.packageKey);
  if (filter?.assigneeId) rows = rows.filter((row) => row.assigneeId === filter.assigneeId);
  if (filter?.needsAttention) {
    rows = rows.filter(
      (row) =>
        row.duplicate.level !== "none" ||
        !row.completeness.dataComplete ||
        row.photos.some((photo) => photo.status === "invalid" || photo.status === "rejected"),
    );
  }
  if (filter?.query) {
    const q = filter.query.trim().toLowerCase();
    rows = rows.filter((row) => {
      const haystack = [
        row.ref,
        row.applicant.firstName,
        row.applicant.lastName,
        row.contact.email,
        row.contact.phone,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return rows;
}

export async function updateApplication(
  id: string,
  patch: Partial<ApplicationRecord>,
): Promise<ApplicationRecord | null> {
  const store = getStore();
  const existing = await store.get<ApplicationRecord>(COLLECTION, id);
  if (!existing) return null;
  const next: ApplicationRecord = { ...existing, ...patch, id, updatedAt: nowIso() };
  await store.set(COLLECTION, id, next);
  return next;
}

export async function listApplicationsForEmail(email: string): Promise<ApplicationRecord[]> {
  const normalised = email.trim().toLowerCase();
  const rows = await getStore().query<ApplicationRecord>(COLLECTION, {
    where: [{ field: "ownerEmail", op: "==", value: normalised }],
  });
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addActivity(input: Omit<ActivityRecord, "id" | "createdAt">): Promise<void> {
  const record: ActivityRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: nowIso(),
  };
  await getStore().set(ACTIVITY, record.id, record);
}

export async function listActivity(
  applicationId: string,
  visibility?: "internal" | "client",
): Promise<ActivityRecord[]> {
  const rows = await getStore().query<ActivityRecord>(ACTIVITY, {
    where: [{ field: "applicationId", op: "==", value: applicationId }],
  });
  const filtered = visibility ? rows.filter((row) => row.visibility === visibility) : rows;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function requiredPhotoMembers(app: Pick<ApplicationRecord, "spouse" | "children" | "household">): string[] {
  const keys = ["applicant"];
  if (app.household.spouseIncluded && app.spouse) keys.push("spouse");
  for (const child of app.children) keys.push(`child:${child.id}`);
  return keys;
}

export function computeCompleteness(input: {
  applicant: PersonData;
  spouse: PersonData | null;
  children: ChildData[];
  contact: ContactData;
  household: HouseholdData;
  photos: PhotoRecord[];
}): Completeness {
  const missing: string[] = [];
  const personRequired: Array<[string, Partial<PersonData>]> = [
    ["applicant.firstName", input.applicant],
    ["applicant.lastName", input.applicant],
    ["applicant.dateOfBirth", input.applicant],
    ["applicant.gender", input.applicant],
    ["applicant.birthCity", input.applicant],
    ["applicant.birthCountry", input.applicant],
  ];

  for (const [key, person] of personRequired) {
    const field = key.split(".")[1] as keyof PersonData;
    if (!person[field]) missing.push(key);
  }
  if (!input.applicant.education) missing.push("applicant.education");

  if (input.household.spouseIncluded) {
    if (!input.spouse) missing.push("spouse");
    else {
      for (const field of ["firstName", "lastName", "dateOfBirth", "gender", "birthCity", "birthCountry"] as const) {
        if (!input.spouse[field]) missing.push(`spouse.${field}`);
      }
    }
  } else if (input.household.maritalStatus === "married" && !input.household.spouseExclusionReason) {
    missing.push("household.spouseExclusionReason");
  }

  for (const child of input.children) {
    for (const field of ["firstName", "lastName", "dateOfBirth", "gender", "birthCity", "birthCountry"] as const) {
      if (!child[field]) missing.push(`child.${child.id}.${field}`);
    }
  }

  if (!input.contact.email) missing.push("contact.email");
  if (!input.contact.phone) missing.push("contact.phone");
  if (!input.contact.addressLine1) missing.push("contact.addressLine1");
  if (!input.contact.city) missing.push("contact.city");
  if (!input.contact.country) missing.push("contact.country");

  const requiredMembers = requiredPhotoMembers({
    spouse: input.spouse,
    children: input.children,
    household: input.household,
  });
  const photosByMember = new Map(input.photos.map((photo) => [photo.memberKey, photo]));
  for (const member of requiredMembers) {
    const photo = photosByMember.get(member);
    if (!photo || photo.status === "invalid") missing.push(`photo.${member}`);
  }

  const photosApproved = requiredMembers.every(
    (member) => photosByMember.get(member)?.status === "approved",
  );

  return {
    dataComplete: missing.filter((key) => !key.startsWith("photo.")).length === 0,
    photosApproved,
    missing,
  };
}

export async function findPotentialDuplicates(input: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  excludeId?: string;
}): Promise<{ level: "none" | "warn"; matches: string[] }> {
  const rows = await getStore().all<ApplicationRecord>(COLLECTION);
  const name = normaliseName(`${input.firstName}${input.lastName}`);
  const matches = rows
    .filter(
      (row) =>
        row.id !== input.excludeId &&
        !["cancelled", "expired", "rejected"].includes(row.status) &&
        normaliseName(`${row.applicant.firstName}${row.applicant.lastName}`) === name &&
        row.applicant.dateOfBirth === input.dateOfBirth,
    )
    .map((row) => row.ref);

  return { level: matches.length > 0 ? "warn" : "none", matches };
}

export async function countApplicationsByStatus(
  dvYear: number,
): Promise<Record<string, number>> {
  const rows = await listApplications({ dvYear });
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}
