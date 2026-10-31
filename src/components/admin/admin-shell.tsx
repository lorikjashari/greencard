"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminLocaleSwitch } from "@/components/admin/locale-switch";
import { cn } from "@/lib/cn";

export interface AdminNavItem {
  href: string;
  label: string;
}

export interface AdminNavGroup {
  key: string;
  label: string;
  items: AdminNavItem[];
}

export function AdminShell({
  children,
  groups,
  user,
  roleLabel,
  signOutLabel,
  viewSiteLabel,
  demo,
  demoLabel,
  demoNote,
  title,
  locale,
}: {
  children: React.ReactNode;
  groups: AdminNavGroup[];
  user: { name: string; email: string };
  roleLabel: string;
  signOutLabel: string;
  viewSiteLabel: string;
  demo: boolean;
  demoLabel: string;
  demoNote: string;
  title: string;
  locale: "sq" | "en";
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

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const navList = (
    <nav className="flex flex-col" aria-label={title}>
      {groups.map((group) => (
        <div key={group.key} className="mb-5">
          <p className="px-2.5 pb-2 font-mono text-3xs uppercase text-paper/35" style={{ letterSpacing: "0.18em" }}>
            {group.label}
          </p>
          <ul>
            {group.items.map((item, index) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 border-l-2 py-1.5 pl-2.5 pr-2 text-[12.5px] leading-5 transition-colors",
                      active
                        ? "border-clay bg-paper/[0.09] font-medium text-paper"
                        : "border-transparent text-paper/60 hover:border-paper/20 hover:bg-white/[0.04] hover:text-paper/90",
                    )}
                  >
                    <span
                      className={cn(
                        "w-3 font-mono text-3xs tabular",
                        active ? "text-clay-200" : "text-paper/25 group-hover:text-paper/40",
                      )}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const userBlock = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center bg-paper/10 font-mono text-3xs text-paper" aria-hidden="true">
          {initials || "—"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-paper">{user.name}</p>
          <p className="truncate font-mono text-3xs text-paper/45">{user.email}</p>
        </div>
      </div>
      <p className="mt-2 font-mono text-3xs uppercase text-clay-200/90" style={{ letterSpacing: "0.14em" }}>
        {roleLabel}
      </p>
      <div className="mt-2.5">
        <AdminLocaleSwitch locale={locale} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <SignOutButton
          label={signOutLabel}
          redirectTo="/admin/login"
          className="text-paper/55 hover:bg-white/10 hover:text-paper"
        />
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-3xs uppercase text-paper/45 transition-colors hover:text-paper"
          style={{ letterSpacing: "0.1em" }}
        >
          {viewSiteLabel}
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-paper px-4 lg:hidden" data-print="hide">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-line-strong text-ink"
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
            className="absolute inset-0 bg-forest-950/50"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute left-0 top-0 flex h-full w-[19rem] flex-col overflow-y-auto bg-forest-950">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
              <Logo href="/admin" compact inverted />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-paper/60 hover:text-paper"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 px-3 py-4">{navList}</div>
            {userBlock}
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]" data-admin-shell>
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-forest-950 bg-forest-950 lg:flex" data-print="hide">
          <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
            <Logo href="/admin" inverted />
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin">{navList}</div>
          {userBlock}
        </aside>

        <div className="min-w-0">
          {demo && (
            <div className="flex items-center gap-2 border-b border-clay-200 bg-clay-50 px-4 py-1.5 lg:px-10" data-print="hide">
              <span className="stamp shrink-0 border-clay-400 text-clay-700">{demoLabel}</span>
              <span className="truncate text-[11px] text-clay-700">{demoNote}</span>
            </div>
          )}
          <main id="admin-main" className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
