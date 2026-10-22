"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Locale } from "@/lib/i18n";
import type { Copy } from "@/messages/get";

export function SiteHeader({ locale, t }: { locale: Locale; t: Copy }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? "border-line bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory"
      }`}
    >
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Logo href={`/${locale}`} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-forest-50 hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={switched}
            hrefLang={other}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-forest"
            aria-label={`${t.common.language}: ${other.toUpperCase()}`}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            {other.toUpperCase()}
          </Link>
          <Link href={`/${locale}/login`} className="btn-ghost btn-sm">
            {t.nav.login}
          </Link>
          <Link href={`/${locale}/apply`} className="btn-primary btn-sm">
            {t.nav.apply}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.common.close : "Menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-3 text-[15px] font-medium text-ink hover:bg-forest-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/login`}
              className="rounded-md px-2 py-3 text-[15px] font-medium text-ink hover:bg-forest-50"
            >
              {t.nav.login}
            </Link>
            <Link href={switched} hrefLang={other} className="rounded-md px-2 py-3 text-[15px] font-medium text-muted">
              {t.common.language}: {other.toUpperCase()}
            </Link>
            <Link href={`/${locale}/apply`} className="btn-primary mt-3 w-full">
              {t.nav.apply}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
