import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getPublicConfig } from "@/lib/config";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";
import { PageHeader, FaqList } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Pyetje të shpeshta",
  description:
    "Përgjigje për çmimin, pagesën, afatet, fotografitë, konfidencialitetin dhe procesin e aplikimit DV.",
};

const EXTRA_FAQS = [
  {
    q: { sq: "Kush mund të aplikojë për Lotarinë DV?", en: "Who can enter the DV lottery?" },
    a: {
      sq: "Duhet të kesh shtetësi të një shteti të pranueshëm, arsim të mesëm (12 vjet) ose dy vjet përvojë pune të kualifikuar, dhe të plotësosh kërkesat e tjera zyrtare. Përputhshmëria e shtetit të lindjes ndryshon çdo vit; kontrollo udhëzimet zyrtare.",
      en: "You need citizenship of an eligible country, a high school education (12 years) or two years of qualifying work experience, and you must meet the other official requirements. Country eligibility changes each year; check the official instructions.",
    },
  },
  {
    q: { sq: "Çfarë ndodh nëse bëj një gabim në formular?", en: "What happens if I make a mistake?" },
    a: {
      sq: "Nëse aplikimi nuk është dorëzuar ende, mund të kthehesh dhe ta korrigjosh. Pas dorëzimit, përdor kërkesën për ndryshim në portal. Stafi e shqyrton dhe të kontakton; ndryshimet nuk aplikohen automatikisht.",
      en: "If the application has not been filed yet, you can go back and correct it. After submission, use the change request in the portal. Staff review it and contact you; changes are not applied automatically.",
    },
  },
  {
    q: { sq: "A mund të përfshij bashkëshortin/ën dhe fëmijët?", en: "Can I include my spouse and children?" },
    a: {
      sq: "Bashkëshorti/ja zakonisht duhet të përfshihet. Përjashtimet e mundshme (p.sh. shtetësi amerikane ose ndarje ligjërisht e dokumentuar) kërkojnë verifikim. Fëmijët e pamartuar nën 21 vjeç përfshihen, edhe nëse nuk emigrojnë.",
      en: "A spouse generally must be included. Possible exceptions (for example US citizenship or a documented legal separation) require verification. Unmarried children under 21 are included, even if they will not immigrate.",
    },
  },
  {
    q: { sq: "Çfarë kërkohet për fotografinë?", en: "What are the photo requirements?" },
    a: {
      sq: "JPEG ose PNG, katrore, 600×600 deri 1200×1200 piksel, me fytyrë të qartë dhe sfond të thjeshtë. Kontrolli automatik është këshillues; stafi vendos përfundimisht. Fotot nuk shfaqen publikisht.",
      en: "JPEG or PNG, square, 600×600 to 1200×1200 pixels, with a clearly visible face and a plain background. The automated check is advisory; staff make the final decision. Photos are never shown publicly.",
    },
  },
  {
    q: { sq: "Çfarë ndodh pas pagesës?", en: "What happens after payment?" },
    a: {
      sq: "Statusi i pagesës përditësohet në portal pasi stafi e konfirmon arkëtimin. Rasti kalon në kontroll, pastaj në radhën e dorëzimit. Dorëzimi bëhet vetëm gjatë periudhës zyrtare dhe numri i konfirmimit regjistrohet pas dorëzimit.",
      en: "The payment status updates in the portal after staff confirm receipt. The case moves to review, then to the filing queue. Filing happens only during the official period, and the confirmation number is recorded after filing.",
    },
  },
  {
    q: { sq: "A mund të anuloj ose të kërkoj rimbursim?", en: "Can I cancel or request a refund?" },
    a: {
      sq: "Kushtet e anulimit dhe rimbursimit nuk janë miratuar përfundimisht. Deri atëherë, dërgo kërkesën me shkrim në emailin e kontaktit dhe stafi e shqyrton rastin. Nuk premtojmë rimbursim automatik.",
      en: "Cancellation and refund terms are not final. Until then, send a written request to the contact email and staff will review the case. We do not promise an automatic refund.",
    },
  },
  {
    q: { sq: "A jeni të lidhur me qeverinë e SHBA-së?", en: "Are you affiliated with the US government?" },
    a: {
      sq: "Jo. Green Card Kosova është shërbim privat. Regjistrimi zyrtar është falas në dvprogram.state.gov dhe askush nuk mund të garantojë përzgjedhje ose vizë.",
      en: "No. Green Card Kosova is a private service. The official entry is free at dvprogram.state.gov, and no one can guarantee selection or a visa.",
    },
  },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);
  const config = getPublicConfig();

  const items = [
    { q: t.home.faq1Q, a: t.home.faq1A },
    { q: t.home.faq2Q, a: t.home.faq2A },
    { q: t.home.faq3Q, a: t.home.faq3A },
    { q: t.home.faq4Q, a: t.home.faq4A },
    { q: t.home.faq5Q, a: t.home.faq5A },
    { q: t.home.faq6Q, a: t.home.faq6A },
    { q: t.home.faq7Q, a: t.home.faq7A },
    { q: t.home.faq8Q, a: t.home.faq8A },
    ...EXTRA_FAQS.map((faq) => ({ q: faq.q[locale], a: faq.a[locale] })),
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t.legal.faqTitle}
        title={t.home.faqTitle}
        lede={pick(
          locale,
          "Përgjigje të shkurtra për pyetjet më të zakonshme. Për rregullat zyrtare, udhëzimet e qeverisë kanë përparësi.",
          "Short answers to the most common questions. For official rules, the government instructions take precedence.",
        )}
      />

      <div className="container-page py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <FaqList items={items} openFirst />

            <div className="mt-10 border-l-2 border-clay bg-paper px-5 py-4">
              <p className="text-[13px] font-semibold text-forest-900">{t.legal.disclaimerTitle}</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{t.home.disclosureBody}</p>
              <a
                href={config.dv.instructionsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="link mt-3 inline-flex items-center gap-1 text-[12.5px]"
              >
                {t.home.officialLink}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-paper p-5">
              <p className="eyebrow-muted text-[10px]">{t.home.contactEyebrow}</p>
              <p className="mt-3 font-serif text-[19px] leading-snug text-forest-900">{t.home.finalTitle}</p>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{t.home.contactBody}</p>
              <Link href={`/${locale}/apply`} className="btn-primary btn-sm mt-4 w-full">
                {t.nav.apply}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/contact`} className="btn-secondary btn-sm mt-2 w-full">
                {t.home.contactCta}
              </Link>
              <dl className="mt-5 space-y-2 border-t border-line pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="meta text-[10px]">{t.common.email}</dt>
                  <dd className="text-[12px] text-ink">
                    <a href={`mailto:${config.contact.email}`} className="hover:text-clay-600">
                      {config.contact.email}
                    </a>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="meta text-[10px]">{t.common.phone}</dt>
                  <dd className="text-[12px] text-ink">
                    <a href={`tel:${config.contact.phone.replace(/\s+/g, "")}`} className="hover:text-clay-600">
                      {config.contact.phone}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
