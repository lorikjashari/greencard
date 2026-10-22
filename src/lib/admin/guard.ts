import "server-only";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/status/transitions";

/**
 * Page-level permission guard. The server actions re-check permissions on
 * every mutation, so hiding a link is never the only protection.
 */
export async function requireAdminPage(permission: Permission) {
  const staff = await requireStaff();
  if (!hasPermission(staff.role, permission)) redirect("/admin/denied");
  return staff;
}
