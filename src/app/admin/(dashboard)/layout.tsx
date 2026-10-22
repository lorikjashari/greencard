import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { hasPermission, ADMIN_NAV } from "@/lib/status/transitions";
import { isDemoMode } from "@/lib/config";
import { ensureDemoSeed } from "@/lib/demo/seed";
import { copy, type Copy } from "@/messages/get";
import { adminLocale } from "@/lib/admin/locale";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Administration · Green Card Kosova",
    template: "%s · Admin · Green Card Kosova",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Serverless demo instances may start with an empty /tmp store. Seed before
  // resolving the session so a signed-in demo user exists on this instance.
  if (isDemoMode()) await ensureDemoSeed();
  const session = await requireStaff();
  const locale = await adminLocale();
  const t = copy(locale);

  const nav = ADMIN_NAV.filter((item) => hasPermission(session.role, item.permission)).map((item) => ({
    href: item.href,
    label: t.admin.nav[item.labelKey as keyof Copy["admin"]["nav"]],
  }));

  if (hasPermission(session.role, "settings.manage")) {
    nav.push({ href: "/admin/outbox", label: t.admin.nav.outbox });
  }

  const roleLabel =
    session.role === "admin"
      ? t.admin.roleAdmin
      : session.role === "operator"
        ? t.admin.roleOperator
        : session.role === "accountant"
          ? t.admin.roleAccountant
          : t.admin.roleViewer;

  return (
    <AdminShell
      nav={nav}
      user={{ name: session.name, email: session.email }}
      roleLabel={roleLabel}
      signOutLabel={t.admin.signOut}
      viewSiteLabel={t.admin.viewSite}
      demo={isDemoMode()}
      demoLabel={t.admin.demoMode}
      demoNote={t.common.demoBanner}
      title={t.admin.title}
    >
      {children}
    </AdminShell>
  );
}

export const revalidate = 0;
export const fetchCache = "force-no-store";

export const runtime = "nodejs";
