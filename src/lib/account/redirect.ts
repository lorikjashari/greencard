import "server-only";

import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { listApplicationsForEmail } from "@/lib/repo/applications";
import { getPublicConfig } from "@/lib/config";
import { ensureDemoSeed } from "@/lib/demo/seed";
import type { Locale } from "@/lib/i18n";

/**
 * The portal keeps one application workspace per case. These stable section
 * routes resolve the signed-in client's newest application and deep-link to
 * the matching section, so blueprint URLs never dead-end.
 */
export async function redirectToLatestApplication(locale: Locale, section: string): Promise<never> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  if (isStaffRole(session.role)) redirect("/admin");

  if (getPublicConfig().demo) await ensureDemoSeed();

  const applications = await listApplicationsForEmail(session.email);
  const latest = applications[0];
  if (!latest) redirect(`/${locale}/account`);

  redirect(`/${locale}/account/${latest.id}#${section}`);
}
