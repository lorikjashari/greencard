import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Locale } from "@/lib/i18n";
import type { Copy } from "@/messages/get";
import type { PublicConfig } from "@/lib/config";

export function SiteFooter({
  locale,
  t,
  config,
}: {
  locale: Locale;
  t: Copy;
  config: Pick<PublicConfig, "contact" | "dv">;
}) {
  const year = new Date().getFullYear();

  const columnHeading = "font-mono text-3xs uppercase text-paper/45";
  const columnLink = "text-[13px] leading-6 text-paper/80 transition-colors hover:text-paper";

  return (
    <footer className="mt-20 bg-forest-950 text-paper" data-print="hide">
      {/* The single most important honest fact on the site. */}
      <a
        href={config.dv.instructionsUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="group block border-b border-white/10 transition-colors hover:bg-white/[0.04]"
      >
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-3.5">
          <p className="font-mono text-[10px] uppercase text-paper/60" style={{ letterSpacing: "0.16em" }}>
            {t.home.officialLink} — dvprogram.state.gov
          </p>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-clay-200" style={{ letterSpacing: "0.16em" }}>
            {t.home.disclosureTitle}
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </a>

      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.7fr_0.8fr_0.8fr_1.1fr] lg:gap-12">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-[19rem] text-[13px] leading-6 text-paper/60">{t.home.footerAbout}</p>
        </div>

        <div>
          <h2 className={columnHeading} style={{ letterSpacing: "0.18em" }}>
            {t.home.footerService}
          </h2>
          <ul className="mt-4 space-y-1.5">
            <li>
              <Link href={`/${locale}/apply`} className={columnLink}>
                {t.nav.apply}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#packages`} className={columnLink}>
                {t.nav.packages}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/faq`} className={columnLink}>
                {t.nav.faq}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/login`} className={columnLink}>
                {t.nav.login}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={columnHeading} style={{ letterSpacing: "0.18em" }}>
            {t.home.footerLegal}
          </h2>
          <ul className="mt-4 space-y-1.5">
            <li>
              <Link href={`/${locale}/privacy`} className={columnLink}>
                {t.legal.privacyTitle}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className={columnLink}>
                {t.legal.termsTitle}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/disclaimer`} className={columnLink}>
                {t.legal.disclaimerTitle}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={columnHeading} style={{ letterSpacing: "0.18em" }}>
            {t.nav.contact}
          </h2>
          <address className="mt-4 space-y-1.5 not-italic">
            <p className="text-[13px] leading-6 text-paper/80">
              <a href={`mailto:${config.contact.email}`} className="transition-colors hover:text-paper">
                {config.contact.email}
              </a>
            </p>
            <p className="text-[13px] leading-6 text-paper/80">
              <a href={`tel:${config.contact.phone.replace(/\s+/g, "")}`} className="transition-colors hover:text-paper">
                {config.contact.phone}
              </a>
            </p>
            <p className="max-w-[15rem] text-[13px] leading-6 text-paper/50">{config.contact.address}</p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[11px] leading-5 text-paper/45 md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="shrink-0 font-mono uppercase" style={{ letterSpacing: "0.1em" }}>
            © {year} Green Card Kosova
          </p>
          <p className="max-w-2xl md:text-right">{t.home.footerDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
