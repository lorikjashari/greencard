import Link from "next/link";
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

  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t.home.footerAbout}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted">{t.home.disclosureTitle}</p>
        </div>

        <div>
          <h2 className="eyebrow">{t.home.footerService}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href={`/${locale}/apply`} className="text-ink/80 hover:text-forest">
                {t.nav.apply}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}#packages`} className="text-ink/80 hover:text-forest">
                {t.nav.packages}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/faq`} className="text-ink/80 hover:text-forest">
                {t.nav.faq}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/login`} className="text-ink/80 hover:text-forest">
                {t.nav.login}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">{t.home.footerLegal}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href={`/${locale}/privacy`} className="text-ink/80 hover:text-forest">
                {t.legal.privacyTitle}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className="text-ink/80 hover:text-forest">
                {t.legal.termsTitle}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/disclaimer`} className="text-ink/80 hover:text-forest">
                {t.legal.disclaimerTitle}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">{t.nav.contact}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/80">
            <li>{config.contact.email}</li>
            <li>{config.contact.phone}</li>
            <li className="text-muted">{config.contact.address}</li>
            <li>
              <a
                href={config.dv.instructionsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="link text-[13px]"
              >
                {t.home.officialLink}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} Green Card Kosova. {t.home.footerRights}
          </p>
          <p className="max-w-xl md:text-right">{t.home.footerDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
