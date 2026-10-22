"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ExternalLink, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/cn";

export interface AdminNavItem {
  href: string;
  label: string;
}

export function AdminShell({
  children,
  nav,
  user,
  roleLabel,
  signOutLabel,
  viewSiteLabel,
  demo,
  demoLabel,
  demoNote,
  title,
}: {
  children: React.ReactNode;
  nav: AdminNavItem[];
  user: { name: string; email: string };
  roleLabel: string;
  signOutLabel: string;
  viewSiteLabel: string;
  demo: boolean;
  demoLabel: string;
  demoNote: string;
  title: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const navList = (
    <nav className="flex flex-col gap-0.5" aria-label={title}>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            isActive(item.href)
              ? "bg-forest text-white"
              : "text-ink/70 hover:bg-forest-50 hover:text-forest-900",
          )}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink"
          aria-label={title}
          aria-expanded={open}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
        <Logo href="/admin" compact />
        <SignOutButton label={signOutLabel} redirectTo="/admin/login" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute left-0 top-0 flex h-full w-[280px] flex-col overflow-y-auto bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo href="/admin" compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 flex-1">{navList}</div>
            <div className="mt-4 border-t border-line pt-3">
              <p className="truncate text-xs font-medium text-ink">{user.name}</p>
              <p className="truncate text-2xs text-muted">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <SignOutButton label={signOutLabel} redirectTo="/admin/login" />
                <Link href="/sq" className="inline-flex items-center gap-1 px-2 text-2xs text-muted">
                  {viewSiteLabel}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white p-4 lg:flex">
          <Logo href="/admin" compact />
          <div className="mt-2 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{title}</p>
          </div>
          <div className="mt-5 flex-1 overflow-y-auto">{navList}</div>

          <div className="mt-4 space-y-2 border-t border-line pt-3">
            <div className="rounded-md bg-ivory px-2.5 py-2">
              <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
              <p className="truncate text-2xs text-muted">{user.email}</p>
              <p className="mt-1 text-2xs font-medium text-forest">{roleLabel}</p>
            </div>
            <div className="flex items-center justify-between gap-1">
              <SignOutButton label={signOutLabel} redirectTo="/admin/login" />
              <Link
                href="/sq"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-muted hover:text-forest"
              >
                {viewSiteLabel}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {demo && (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-2xs text-amber-900">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="font-semibold uppercase tracking-wide">{demoLabel}</span>
              <span className="truncate">{demoNote}</span>
            </div>
          )}
          <main id="admin-main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
