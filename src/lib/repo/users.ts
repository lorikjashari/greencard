import "server-only";

import { getStore } from "@/lib/store";
import { nowIso } from "@/lib/ids";
import type { Role, UserRecord } from "@/lib/types";

const COLLECTION = "users";

export async function listUsers(): Promise<UserRecord[]> {
  return getStore().query<UserRecord>(COLLECTION, {
    orderBy: [{ field: "createdAt", direction: "asc" }],
  });
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalised = email.trim().toLowerCase();
  const rows = await getStore().query<UserRecord>(COLLECTION, {
    where: [{ field: "email", op: "==", value: normalised }],
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  return getStore().get<UserRecord>(COLLECTION, id);
}

export async function ensureUser(input: {
  email: string;
  name?: string;
  role?: Role;
  invitedBy?: string | null;
}): Promise<UserRecord> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  const now = nowIso();

  if (existing) {
    const patch: Partial<UserRecord> = { lastSignInAt: now };
    await getStore().merge<UserRecord>(COLLECTION, existing.id, patch);
    return { ...existing, ...patch };
  }

  const record: UserRecord = {
    id: crypto.randomUUID(),
    email,
    name: input.name ?? email.split("@")[0],
    role: input.role ?? "viewer",
    active: true,
    createdAt: now,
    lastSignInAt: now,
    invitedBy: input.invitedBy ?? null,
  };
  await getStore().set(COLLECTION, record.id, record);
  return record;
}

export async function setUserRole(
  userId: string,
  role: Role,
  actorEmail: string,
): Promise<UserRecord | null> {
  const store = getStore();
  const user = await store.get<UserRecord>(COLLECTION, userId);
  if (!user) return null;
  await store.merge<UserRecord>(COLLECTION, userId, { role });
  void actorEmail;
  return { ...user, role };
}

export async function setUserActive(userId: string, active: boolean): Promise<UserRecord | null> {
  const store = getStore();
  const user = await store.get<UserRecord>(COLLECTION, userId);
  if (!user) return null;
  await store.merge<UserRecord>(COLLECTION, userId, { active });
  return { ...user, active };
}

export async function touchSignIn(userId: string): Promise<void> {
  await getStore().merge<UserRecord>(COLLECTION, userId, { lastSignInAt: nowIso() });
}

export async function upsertTeamMember(input: {
  email: string;
  name: string;
  role: Role;
  actorEmail: string;
}): Promise<UserRecord> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    const patch: Partial<UserRecord> = {
      name: input.name.trim() || existing.name,
      role: input.role,
      active: true,
      invitedBy: input.actorEmail,
    };
    await getStore().merge<UserRecord>(COLLECTION, existing.id, patch);
    return { ...existing, ...patch };
  }

  const record: UserRecord = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim() || email.split("@")[0]!,
    role: input.role,
    active: true,
    createdAt: nowIso(),
    lastSignInAt: null,
    invitedBy: input.actorEmail,
  };
  await getStore().set(COLLECTION, record.id, record);
  return record;
}

export async function updateUserRecord(
  userId: string,
  patch: Partial<Pick<UserRecord, "role" | "active" | "name">>,
): Promise<UserRecord | null> {
  const store = getStore();
  const user = await store.get<UserRecord>(COLLECTION, userId);
  if (!user) return null;
  await store.merge<UserRecord>(COLLECTION, userId, patch);
  return { ...user, ...patch };
}

export async function countActiveAdmins(): Promise<number> {
  const users = await listUsers();
  return users.filter((user) => user.role === "admin" && user.active).length;
}

export const MAX_FAILED_SIGN_INS = 5;
export const LOCK_MINUTES = 15;

export function isUserLocked(user: UserRecord, now = Date.now()): boolean {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > now);
}

export async function registerFailedSignIn(user: UserRecord): Promise<{
  attempts: number;
  lockedUntil: string | null;
}> {
  const attempts = (user.failedSignIns ?? 0) + 1;
  const lock =
    attempts >= MAX_FAILED_SIGN_INS
      ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
      : null;
  await getStore().merge<UserRecord>(COLLECTION, user.id, {
    failedSignIns: lock ? 0 : attempts,
    lockedUntil: lock ?? user.lockedUntil ?? null,
  });
  return { attempts, lockedUntil: lock };
}

export async function registerSuccessfulSignIn(userId: string): Promise<void> {
  await getStore().merge<UserRecord>(COLLECTION, userId, {
    failedSignIns: 0,
    lockedUntil: null,
    lastSignInAt: nowIso(),
  });
}

export async function setUserPasswordHash(email: string, passwordHash: string): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  await getStore().merge<UserRecord>(COLLECTION, user.id, {
    passwordHash,
    failedSignIns: 0,
    lockedUntil: null,
  });
  return { ...user, passwordHash, failedSignIns: 0, lockedUntil: null };
}
