import "server-only";

import { getBlobStore, getStore } from "@/lib/store";
import { demoAvatarPng } from "./png";
import { computeCompleteness } from "@/lib/repo/applications";
import { getSettings } from "@/lib/repo/settings";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import { logAudit } from "@/lib/repo/audit";
import type {
  ApplicationRecord,
  ChildData,
  ContactData,
  DvYearRecord,
  FilingRecord,
  HouseholdData,
  OrderRecord,
  PersonData,
  PhotoIssue,
  PhotoRecord,
  UserRecord,
} from "@/lib/types";

const SEED_VERSION = 3;
const SEED_ID = "demo-seed";

const png = demoAvatarPng(600);

function daysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function daysFromNow(days: number): string {
  return daysAgo(-days);
}

function person(
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  gender: "male" | "female",
  birthCity: string,
  birthCountry = "XK",
  education: PersonData["education"] = "university",
): PersonData {
  return {
    firstName,
    middleName: "",
    lastName,
    dateOfBirth,
    gender,
    birthCity,
    birthCountry,
    nationality: birthCountry,
    education,
  };
}

function child(
  id: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  gender: "male" | "female",
): ChildData {
  return {
    ...person(firstName, lastName, dateOfBirth, gender, "Prishtinë"),
    id,
    married: false,
    livesWithApplicant: true,
    isStepchild: false,
  };
}

function contact(email: string, city = "Prishtinë"): ContactData {
  return {
    email,
    phone: "+383 44 000 000",
    addressLine1: "Rr. Shembull 12",
    addressLine2: "",
    city,
    postalCode: "10000",
    country: "XK",
    preferredLocale: "sq",
  };
}

interface SeedSpec {
  id: string;
  ref: string;
  status: ApplicationRecord["status"];
  paymentStatus: ApplicationRecord["paymentStatus"];
  packageKey: ApplicationRecord["packageKey"];
  amountCents: number;
  household: HouseholdData;
  applicant: PersonData;
  spouse: PersonData | null;
  children: ChildData[];
  contact: ContactData;
  ownerEmail: string;
  assigneeId: string | null;
  createdDays: number;
  submittedDays: number;
  photoState: "valid" | "approved" | "rejected" | "invalid";
  duplicateRefs?: string[];
  statusReason?: string;
}

function safeMember(memberKey: string): string {
  return memberKey.replace(/[^a-zA-Z0-9_-]/g, "-");
}

async function seedApplication(spec: SeedSpec): Promise<ApplicationRecord> {
  const store = getStore();
  const blobs = getBlobStore();

  const members: Array<{ key: string; name: string }> = [
    {
      key: "applicant",
      name: `${spec.applicant.firstName} ${spec.applicant.lastName}`.trim(),
    },
  ];
  if (spec.household.spouseIncluded && spec.spouse) {
    members.push({
      key: "spouse",
      name: `${spec.spouse.firstName} ${spec.spouse.lastName}`.trim(),
    });
  }
  for (const c of spec.children) {
    members.push({ key: `child:${c.id}`, name: `${c.firstName} ${c.lastName}`.trim() });
  }

  const photos: PhotoRecord[] = [];
  for (const member of members) {
    const key = `photos/demo/${spec.ref}/${safeMember(member.key)}.png`;
    await blobs.put(key, png, "image/png");

    const status: PhotoRecord["status"] =
      spec.photoState === "invalid" && member.key === "child:" + (spec.children[0]?.id ?? "")
        ? "invalid"
        : spec.photoState === "rejected" && member.key === "spouse"
          ? "rejected"
          : spec.photoState === "approved"
            ? "approved"
            : "valid";

    const issues: PhotoIssue[] =
      status === "invalid"
        ? [
            {
              code: "dimensions",
              messageSq: "Përmasat nuk përputhen me kërkesat (600×600 deri 1200×1200).",
              messageEn: "Dimensions do not meet requirements (600×600 to 1200×1200).",
              severity: "error",
            },
          ]
        : spec.photoState === "rejected" && member.key === "spouse"
          ? [
              {
                code: "face_obscured",
                messageSq: "Fytyra nuk shihet qartë; fotografia duhet zëvendësuar.",
                messageEn: "The face is not clearly visible; the photo must be replaced.",
                severity: "error",
              },
            ]
          : [];

    photos.push({
      id: `demo-photo-${spec.ref}-${safeMember(member.key)}`,
      memberKey: member.key,
      memberName: member.name,
      storageKey: key,
      originalName: "demo-photo.png",
      contentType: "image/png",
      bytes: png.length,
      width: 600,
      height: 600,
      status,
      issues,
      rulesVersion: "2027.1",
      uploadedAt: daysAgo(spec.createdDays, 11),
      reviewedAt: status === "approved" || status === "rejected" ? daysAgo(spec.createdDays - 1, 9) : undefined,
      reviewedBy: status === "approved" || status === "rejected" ? "operator@demo.greencardkosova.com" : undefined,
    });
  }

  const completeness = computeCompleteness({
    applicant: spec.applicant,
    spouse: spec.spouse,
    children: spec.children,
    contact: spec.contact,
    household: spec.household,
    photos,
  });

  const record: ApplicationRecord = {
    id: spec.id,
    ref: spec.ref,
    dvYear: 2027,
    locale: "sq",
    status: spec.status,
    paymentStatus: spec.paymentStatus,
    packageKey: spec.packageKey,
    amountCents: spec.amountCents,
    currency: "EUR",
    pricingRulesVersion: "2027.1",
    household: spec.household,
    applicant: spec.applicant,
    spouse: spec.spouse,
    children: spec.children,
    contact: spec.contact,
    consents: [
      {
        type: "terms",
        policyVersion: "2026-10-draft",
        acceptedAt: daysAgo(spec.submittedDays, 10),
        locale: "sq",
      },
      {
        type: "privacy",
        policyVersion: "2026-10-draft",
        acceptedAt: daysAgo(spec.submittedDays, 10),
        locale: "sq",
      },
    ],
    photos,
    completeness,
    duplicate: {
      level: spec.duplicateRefs?.length ? "warn" : "none",
      matches: spec.duplicateRefs ?? [],
      checkedAt: daysAgo(spec.submittedDays, 10),
    },
    statusReason: spec.statusReason,
    assigneeId: spec.assigneeId,
    ownerEmail: spec.ownerEmail,
    claimedByUid: null,
    isDemo: true,
    submittedAt: daysAgo(spec.submittedDays, 10),
    createdAt: daysAgo(spec.createdDays, 10),
    updatedAt: daysAgo(Math.max(0, spec.submittedDays - 1), 12),
    createdBy: "public",
  };

  await store.set("applications", record.id, record);
  return record;
}

async function seedActivity(applicationId: string, entries: Array<[number, string, string]>) {
  const store = getStore();
  for (const [index, [days, message, visibility]] of entries.entries()) {
    const id = `demo-activity-${applicationId}-${index}`;
    await store.set("activity", id, {
      id,
      applicationId,
      type: "note",
      actorId: null,
      actorName: "Sistemi (demo)",
      visibility: visibility === "client" ? "client" : "internal",
      message,
      createdAt: daysAgo(days, 12),
    });
  }
}

async function seedOrder(input: {
  id: string;
  applicationId: string;
  ref: string;
  amountCents: number;
  status: OrderRecord["status"];
  createdDays: number;
  paidDays?: number;
  receivedBy?: string;
}): Promise<OrderRecord> {
  const order: OrderRecord = {
    id: input.id,
    applicationId: input.applicationId,
    ref: input.ref,
    amountCents: input.amountCents,
    currency: "EUR",
    method: "cash",
    status: input.status,
    pricingRulesVersion: "2027.1",
    provider: "cash",
    providerRef: null,
    createdAt: daysAgo(input.createdDays, 10),
    updatedAt: daysAgo(input.paidDays ?? input.createdDays, 12),
    paidAt: input.paidDays != null ? daysAgo(input.paidDays, 12) : null,
    expiresAt: daysFromNow(input.status === "pending_cash" ? 4 : -1),
    receivedBy: input.receivedBy ?? (input.paidDays != null ? "accountant@demo.greencardkosova.com" : null),
    receivedAt: input.paidDays != null ? daysAgo(input.paidDays, 12) : null,
    receivedAmountCents: input.paidDays != null ? input.amountCents : null,
    receivingMethod: input.paidDays != null ? "office" : null,
    evidenceNote: input.paidDays != null ? "Demo seed payment" : null,
    amountMismatch: false,
    refundedAt: input.status === "refunded" ? daysAgo(2, 12) : null,
    refundReason: input.status === "refunded" ? "Rast i papranueshëm; rimbursim i plotë." : null,
  };
  await getStore().set("orders", order.id, order);
  return order;
}

let seedPromise: Promise<void> | null = null;

export function ensureDemoSeed(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = runSeed().catch((error) => {
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const store = getStore();
  const existing = await store.get<{ version: number }>("systemConfig", SEED_ID);
  if (existing?.version) return;

  await getSettings();
  await getActiveDvYear();

  const users: UserRecord[] = [
    {
      id: "demo-user-admin",
      email: "admin@demo.greencardkosova.com",
      name: "Arta Berisha",
      role: "admin",
      active: true,
      createdAt: daysAgo(90),
      lastSignInAt: daysAgo(1),
    },
    {
      id: "demo-user-operator",
      email: "operator@demo.greencardkosova.com",
      name: "Driton Krasniqi",
      role: "operator",
      active: true,
      createdAt: daysAgo(80),
      lastSignInAt: daysAgo(1),
    },
    {
      id: "demo-user-accountant",
      email: "accountant@demo.greencardkosova.com",
      name: "Vjosa Hoxha",
      role: "accountant",
      active: true,
      createdAt: daysAgo(70),
      lastSignInAt: daysAgo(2),
    },
    {
      id: "demo-user-viewer",
      email: "viewer@demo.greencardkosova.com",
      name: "Besnik Gashi",
      role: "viewer",
      active: true,
      createdAt: daysAgo(60),
      lastSignInAt: daysAgo(4),
    },
    {
      id: "demo-user-client",
      email: "client@demo.greencardkosova.com",
      name: "Elira Dema",
      role: "client",
      active: true,
      createdAt: daysAgo(10),
      lastSignInAt: daysAgo(1),
    },
  ];
  for (const user of users) {
    await store.set("users", user.id, user);
  }

  const elira = person("Elira", "Dema", "1996-04-12", "female", "Prishtinë");

  const spec1: SeedSpec = {
    id: "demo-app-1",
    ref: "GCK-4KT9M",
    status: "submitted",
    paymentStatus: "pending_cash",
    packageKey: "individual",
    amountCents: 1250,
    household: { maritalStatus: "single", spouseIncluded: false, spouseExclusionReason: "", declaredChildren: 0 },
    applicant: elira,
    spouse: null,
    children: [],
    contact: contact("client@demo.greencardkosova.com"),
    ownerEmail: "client@demo.greencardkosova.com",
    assigneeId: null,
    createdDays: 2,
    submittedDays: 2,
    photoState: "valid",
  };

  const arben = person("Arben", "Krasniqi", "1989-02-03", "male", "Prizren");
  const blerta = person("Blerta", "Krasniqi", "1991-07-19", "female", "Prizren");
  const spec2: SeedSpec = {
    id: "demo-app-2",
    ref: "GCK-8QW2N",
    status: "in_review",
    paymentStatus: "paid",
    packageKey: "couple",
    amountCents: 1750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 0 },
    applicant: arben,
    spouse: blerta,
    children: [],
    contact: contact("arben.krasniqi@example.com", "Prizren"),
    ownerEmail: "arben.krasniqi@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 5,
    submittedDays: 5,
    photoState: "approved",
  };

  const driton = person("Driton", "Berisha", "1988-11-02", "male", "Mitrovicë");
  const arta = person("Arta", "Berisha", "1990-06-14", "female", "Mitrovicë");
  const era = child("demo-child-1", "Era", "Berisha", "2014-03-21", "female");
  const luan = child("demo-child-2", "Luan", "Berisha", "2017-09-08", "male");
  const spec3: SeedSpec = {
    id: "demo-app-3",
    ref: "GCK-2MX7P",
    status: "ready_to_file",
    paymentStatus: "paid",
    packageKey: "family",
    amountCents: 2750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 2 },
    applicant: driton,
    spouse: arta,
    children: [era, luan],
    contact: contact("driton.berisha@example.com", "Mitrovicë"),
    ownerEmail: "driton.berisha@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 8,
    submittedDays: 8,
    photoState: "approved",
  };

  const fatlum = person("Fatlum", "Gashi", "1985-01-30", "male", "Pejë");
  const teuta = person("Teuta", "Gashi", "1987-05-17", "female", "Pejë");
  const nora = child("demo-child-3", "Nora", "Gashi", "2012-12-02", "female");
  const spec4: SeedSpec = {
    id: "demo-app-4",
    ref: "GCK-9RB4T",
    status: "filed",
    paymentStatus: "paid",
    packageKey: "family",
    amountCents: 2750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 1 },
    applicant: fatlum,
    spouse: teuta,
    children: [nora],
    contact: contact("fatlum.gashi@example.com", "Pejë"),
    ownerEmail: "fatlum.gashi@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 14,
    submittedDays: 14,
    photoState: "approved",
  };

  const mirjeta = person("Mirjeta", "Syla", "1992-08-25", "female", "Gjakovë");
  const diell = child("demo-child-4", "Diell", "Syla", "2015-06-11", "male");
  const hana = child("demo-child-5", "Hana", "Syla", "2019-01-27", "female");
  const spec5: SeedSpec = {
    id: "demo-app-5",
    ref: "GCK-5CN8K",
    status: "needs_information",
    paymentStatus: "pending_cash",
    packageKey: "family",
    amountCents: 2750,
    household: {
      maritalStatus: "single",
      spouseIncluded: false,
      spouseExclusionReason: "",
      declaredChildren: 2,
    },
    applicant: mirjeta,
    spouse: null,
    children: [diell, hana],
    contact: contact("mirjeta.syla@example.com", "Gjakovë"),
    ownerEmail: "mirjeta.syla@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 6,
    submittedDays: 6,
    photoState: "approved",
    duplicateRefs: ["GCK-6TJ9S"],
    statusReason: "Kërkohet dokumentacion për kujdestarinë dhe sqarim i përbërjes familjare.",
  };

  const endrit = person("Endrit", "Bytyqi", "1993-03-19", "male", "Ferizaj");
  const vesa = person("Vesa", "Bytyqi", "1994-10-05", "female", "Ferizaj");
  const spec6: SeedSpec = {
    id: "demo-app-6",
    ref: "GCK-7HD3V",
    status: "needs_information",
    paymentStatus: "paid",
    packageKey: "couple",
    amountCents: 1750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 0 },
    applicant: endrit,
    spouse: vesa,
    children: [],
    contact: contact("endrit.bytyqi@example.com", "Ferizaj"),
    ownerEmail: "endrit.bytyqi@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 9,
    submittedDays: 9,
    photoState: "rejected",
    duplicateRefs: ["GCK-6TJ9S"],
    statusReason: "Fotografia e bashkëshortit/kes nuk përputhet me kërkesat.",
  };

  const alban = person("Alban", "Morina", "1980-12-09", "male", "Gjilan");
  const spec7: SeedSpec = {
    id: "demo-app-7",
    ref: "GCK-3PL6W",
    status: "rejected",
    paymentStatus: "refunded",
    packageKey: "individual",
    amountCents: 1250,
    household: { maritalStatus: "single", spouseIncluded: false, spouseExclusionReason: "", declaredChildren: 0 },
    applicant: alban,
    spouse: null,
    children: [],
    contact: contact("alban.morina@example.com", "Gjilan"),
    ownerEmail: "alban.morina@example.com",
    assigneeId: "demo-user-admin",
    createdDays: 16,
    submittedDays: 16,
    photoState: "approved",
    statusReason: "Shteti i lindjes nuk plotëson kriterin e përputhshmërisë për këtë vit.",
  };

  const selim = person("Selim", "Rexha", "1983-04-23", "male", "Prishtinë");
  const teutaR = person("Teuta", "Rexha", "1986-09-15", "female", "Prishtinë");
  const arlind = child("demo-child-6", "Arlind", "Rexha", "2011-02-19", "male");
  const diona = child("demo-child-7", "Diona", "Rexha", "2015-11-30", "female");
  const blend = child("demo-child-8", "Blend", "Rexha", "2020-07-07", "male");
  const spec8: SeedSpec = {
    id: "demo-app-8",
    ref: "GCK-6TJ9S",
    status: "submitted",
    paymentStatus: "pending_cash",
    packageKey: "family",
    amountCents: 2750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 3 },
    applicant: selim,
    spouse: teutaR,
    children: [arlind, diona, blend],
    contact: contact("selim.rexha@example.com"),
    ownerEmail: "selim.rexha@example.com",
    assigneeId: null,
    createdDays: 1,
    submittedDays: 1,
    photoState: "invalid",
  };

  const gent = person("Gent", "Hoxha", "1987-07-04", "male", "Prishtinë");
  const rina = person("Rina", "Hoxha", "1989-02-22", "female", "Prishtinë");
  const spec9: SeedSpec = {
    id: "demo-app-9",
    ref: "GCK-1VK5D",
    status: "confirmation_sent",
    paymentStatus: "paid",
    packageKey: "couple",
    amountCents: 1750,
    household: { maritalStatus: "married", spouseIncluded: true, spouseExclusionReason: "", declaredChildren: 0 },
    applicant: gent,
    spouse: rina,
    children: [],
    contact: contact("gent.hoxha@example.com"),
    ownerEmail: "gent.hoxha@example.com",
    assigneeId: "demo-user-operator",
    createdDays: 21,
    submittedDays: 21,
    photoState: "approved",
  };

  const specs = [spec1, spec2, spec3, spec4, spec5, spec6, spec7, spec8, spec9];
  for (const spec of specs) {
    await seedApplication(spec);
  }

  await seedOrder({
    id: "demo-order-1",
    applicationId: "demo-app-1",
    ref: "PAY-7K2M4",
    amountCents: 1250,
    status: "pending_cash",
    createdDays: 2,
  });
  await seedOrder({
    id: "demo-order-2",
    applicationId: "demo-app-2",
    ref: "PAY-9Q4T1",
    amountCents: 1750,
    status: "paid",
    createdDays: 5,
    paidDays: 4,
  });
  await seedOrder({
    id: "demo-order-3",
    applicationId: "demo-app-3",
    ref: "PAY-3H8N5",
    amountCents: 2750,
    status: "paid",
    createdDays: 8,
    paidDays: 7,
  });
  await seedOrder({
    id: "demo-order-4",
    applicationId: "demo-app-4",
    ref: "PAY-5J1R9",
    amountCents: 2750,
    status: "paid",
    createdDays: 14,
    paidDays: 13,
  });
  await seedOrder({
    id: "demo-order-5",
    applicationId: "demo-app-5",
    ref: "PAY-2W6C7",
    amountCents: 2750,
    status: "pending_cash",
    createdDays: 6,
  });
  await seedOrder({
    id: "demo-order-6",
    applicationId: "demo-app-6",
    ref: "PAY-8L3P2",
    amountCents: 1750,
    status: "paid",
    createdDays: 9,
    paidDays: 8,
  });
  await seedOrder({
    id: "demo-order-7",
    applicationId: "demo-app-7",
    ref: "PAY-1D7V4",
    amountCents: 1250,
    status: "refunded",
    createdDays: 16,
    paidDays: 15,
  });
  await seedOrder({
    id: "demo-order-8",
    applicationId: "demo-app-8",
    ref: "PAY-6B2X8",
    amountCents: 2750,
    status: "pending_cash",
    createdDays: 1,
  });
  await seedOrder({
    id: "demo-order-9",
    applicationId: "demo-app-9",
    ref: "PAY-4F9S3",
    amountCents: 1750,
    status: "paid",
    createdDays: 21,
    paidDays: 20,
  });

  const filings: FilingRecord[] = [
    {
      id: "demo-filing-1",
      applicationId: "demo-app-4",
      dvYear: 2027,
      confirmationNumber: "2027-DEMO-48213",
      filedAt: daysAgo(10, 14),
      filedBy: "operator@demo.greencardkosova.com",
      notes: "Dorëzuar manualisht në faqen zyrtare (demo).",
      createdAt: daysAgo(10, 14),
    },
    {
      id: "demo-filing-2",
      applicationId: "demo-app-9",
      dvYear: 2027,
      confirmationNumber: "2027-DEMO-91077",
      filedAt: daysAgo(18, 11),
      filedBy: "operator@demo.greencardkosova.com",
      notes: null,
      createdAt: daysAgo(18, 11),
    },
  ];
  for (const filing of filings) {
    await store.set("filings", filing.id, filing);
  }

  await seedActivity("demo-app-1", [
    [2, "Aplikimi u dorëzua nga klienti.", "client"],
    [1, "Pagesa në dorë është ende në pritje.", "client"],
  ]);
  await seedActivity("demo-app-2", [
    [5, "Aplikimi u dorëzua.", "client"],
    [4, "Pagesa u konfirmua në zyrë.", "client"],
    [3, "Fotot u aprovuan nga operatori.", "internal"],
    [1, "Kontrolli i të dhënave përfundoi; rasti vazhdon.", "internal"],
  ]);
  await seedActivity("demo-app-3", [
    [8, "Aplikimi u dorëzua.", "client"],
    [7, "Pagesa u konfirmua.", "client"],
    [2, "Rasti u shënua gati për dorëzim.", "internal"],
  ]);
  await seedActivity("demo-app-4", [
    [14, "Aplikimi u dorëzua.", "client"],
    [10, "Dorëzimi u regjistrua me numër konfirmimi.", "client"],
  ]);
  await seedActivity("demo-app-5", [
    [6, "Aplikimi u dorëzua.", "client"],
    [3, "Kërkuam dokumentacion shtesë për fëmijët.", "client"],
  ]);
  await seedActivity("demo-app-6", [
    [9, "Aplikimi u dorëzua.", "client"],
    [8, "Pagesa u konfirmua.", "client"],
    [4, "Fotografia e bashkëshortit/kes u refuzua.", "client"],
  ]);
  await seedActivity("demo-app-8", [
    [1, "Aplikimi u dorëzua.", "client"],
  ]);

  await logAudit({
    actor: { uid: "demo-user-admin", email: "admin@demo.greencardkosova.com" },
    action: "application.status_changed",
    entityType: "application",
    entityId: "demo-app-3",
    summary: "Statusi u ndryshua në ready_to_file.",
    metadata: { from: "in_review", to: "ready_to_file" },
  });
  await logAudit({
    actor: { uid: "demo-user-operator", email: "operator@demo.greencardkosova.com" },
    action: "filing.recorded",
    entityType: "application",
    entityId: "demo-app-4",
    summary: "Dorëzimi u regjistrua me numër konfirmimi.",
  });
  await logAudit({
    actor: { uid: "demo-user-accountant", email: "accountant@demo.greencardkosova.com" },
    action: "payment.cash_recorded",
    entityType: "order",
    entityId: "demo-order-3",
    summary: "Pagesa në dorë u konfirmua.",
  });
  await logAudit({
    actor: { uid: "demo-user-admin", email: "admin@demo.greencardkosova.com" },
    action: "settings.viewed",
    entityType: "settings",
    entityId: "main",
    summary: "Cilësimet u hapën.",
  });

  await store.set("dataRequests", "demo-data-request-1", {
    id: "demo-data-request-1",
    applicationId: "demo-app-5",
    email: "mirjeta.syla@example.com",
    type: "access",
    message: "Kërkoj një kopje të të dhënave të mia dhe të fëmijëve.",
    status: "open",
    createdAt: daysAgo(2, 9),
    completedAt: null,
    handledBy: null,
    notes: null,
  });

  await store.set("systemConfig", SEED_ID, {
    id: SEED_ID,
    version: SEED_VERSION,
    seededAt: new Date().toISOString(),
  });
}

/** Returns the seeded demo accounts for the sign-in screen. */
export const DEMO_ACCOUNTS = [
  { email: "admin@demo.greencardkosova.com", name: "Arta Berisha", role: "admin" as const },
  { email: "operator@demo.greencardkosova.com", name: "Driton Krasniqi", role: "operator" as const },
  { email: "accountant@demo.greencardkosova.com", name: "Vjosa Hoxha", role: "accountant" as const },
  { email: "viewer@demo.greencardkosova.com", name: "Besnik Gashi", role: "viewer" as const },
  { email: "client@demo.greencardkosova.com", name: "Elira Dema", role: "client" as const },
];

export async function demoDvYear(): Promise<DvYearRecord> {
  return getActiveDvYear();
}
