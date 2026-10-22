import "server-only";

import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "./session";
import { findUserById } from "@/lib/repo/users";
import type { Role, SessionUser } from "@/lib/types";

export async function requireSession(returnTo?: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return session;
}

/**
 * Staff guard. Re-reads the user record so deactivation and role changes take
 * effect immediately instead of waiting for the session cookie to expire.
 */
export async function requireStaff(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isStaffRole(session.role)) redirect("/admin/login?error=forbidden");

  const user = await findUserById(session.uid);
  if (!user || !user.active || !isStaffRole(user.role)) {
    redirect("/admin/login?error=inactive");
  }

  return {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const session = await requireStaff();
  if (!roles.includes(session.role)) redirect("/admin/denied");
  return session;
}

/** For server actions: returns null instead of redirecting. */
export async function currentStaff(roles?: Role[]): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) return null;

  const user = await findUserById(session.uid);
  if (!user || !user.active || !isStaffRole(user.role)) return null;

  const effective: SessionUser = {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  if (roles && !roles.includes(effective.role)) return null;
  return effective;
}
