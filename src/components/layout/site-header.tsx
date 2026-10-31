"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import type { Copy } from "@/messages/get";

export function SiteHeader({
  locale,
  t,
  contact,
}: {
  locale: Locale;
  t: Copy;
  contact: { phone: string; email: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const other: Locale = locale === "sq" ? "en" : "sq";
  const switched = (() => {
    const segments = pathname.split("/");
    if (segments.length > 1) segments[1] = other;
    return segments.join("/") || `/${other}`;
  })();

  const links = [
    { href: `/${locale}#how-it-works`, label: t.nav.howItWorks },
    { href: `/${locale}#packages`, label: t.nav.packages },
    { href: `/${locale}/faq`, label: t.nav.faq },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];

  // In-page anchors are never "current"; only real routes can be.
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory" data-print="hide">
      {/* Utility strip — real information, no decorative chrome. */}
      <div className="hidden border-b border-line/60 md:block">
        <div className="container-page flex h-8 items-center justify-between gap-6">
          <p className="meta text-[10px]">{t.home.disclosureTitle}</p>
          <div className="flex items-center gap-5">
            <a
              href={`tel:${contact.phone.replace(/\s+/g, "")}`}
              className="meta flex items-center gap-1.5 text-[10px] transition-colors hover:text-forest-800"
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              {contact.phone}
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="meta hidden text-[10px] transition-colors hover:text-forest-800 sm:inline"
            >
              {contact.email}
            </a>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo href={`/${locale}`} priority />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative py-1 text-[13px] font-medium transition-colors",
                isActive(link.href) ? "text-forest-900" : "text-ink/70 hover:text-forest-800",
                "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-clay after:transition-transform after:duration-200 hover:after:scale-x-100",
                isActive(link.href) && "after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div
            className="flex items-center gap-1 font-mono text-[10px] uppercase"
            style={{ letterSpacing: "0.14em" }}
            aria-label={t.common.language}
          >
            {(["sq", "en"] as const).map((candidate, index) => (
              <span key={candidate} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="text-line-strong" aria-hidden="true">
                    /
                  </span>
                )}
                {candidate === locale ? (
                  <span className="px-1 text-forest-900" aria-current="true">
                    {candidate.toUpperCase()}
                  </span>
                ) : (
                  <Link
                    href={switched}
                    hrefLang={candidate}
                    className="px-1 text-muted transition-colors hover:text-clay-600"
                  >
                    {candidate.toUpperCase()}
                  </Link>
                )}
              </span>
            ))}
          </div>
          <span className="h-4 w-px bg-line" aria-hidden="true" />
          <Link href={`/${locale}/login`} className="text-[13px] font-medium text-ink/75 transition-colors hover:text-forest-800">
            {t.nav.login}
          </Link>
          <Link href={`/${locale}/apply`} className="btn-primary btn-sm">
            {t.nav.apply}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line-strong text-ink transition-colors hover:bg-paper lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.common.close : "Menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-ivory lg:hidden"
        >
          <nav className="container-page flex flex-col divide-y divide-line py-2" aria-label="Mobile">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-baseline gap-3 py-4"
                onClick={() => setOpen(false)}
              >
                <span className="font-mono text-3xs text-clay-600" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-[22px] leading-none text-forest-900">{link.label}</span>
              </Link>
            ))}
            <Link href={`/${locale}/login`} className="flex items-baseline gap-3 py-4" onClick={() => setOpen(false)}>
              <span className="font-mono text-3xs text-clay-600" aria-hidden="true">
                05
              </span>
              <span className="font-serif text-[22px] leading-none text-forest-900">{t.nav.login}</span>
            </Link>
          </nav>

          <div className="container-page mt-2 flex flex-col gap-3 pb-10">
            <Link href={`/${locale}/apply`} className="btn-primary w-full" onClick={() => setOpen(false)}>
              {t.nav.apply}
            </Link>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="meta text-[11px]">
                {contact.phone}
              </a>
              <Link
                href={switched}
                hrefLang={other}
                className="font-mono text-[11px] uppercase text-forest-800 underline decoration-clay decoration-2 underline-offset-4"
                onClick={() => setOpen(false)}
              >
                {other.toUpperCase()}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
