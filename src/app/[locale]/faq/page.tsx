import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { getPublicConfig } from "@/lib/config";
import { isLocale, pick, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const metadata: Metadata = {
  title: "Pyetje të shpeshta",
  description:
    "Përgjigje për çmimin, pagesën, afatet, fotografitë, konfidencialitetin dhe procesin e aplikimit DV.",
};

const EXTRA_FAQS = [
  {
    q: {
      sq: "Kush mund të aplikojë për Lotarinë DV?",
      en: "Who can enter the DV lottery?",
    },
    a: {
      sq: "Duhet të kesh shtetësi të një shteti të pranueshëm, arsim të mesëm (12 vjet) ose dy vjet përvojë pune të kualifikuar, dhe të plotësosh kërkesat e tjera zyrtare. Përputhshmëria e shtetit të lindjes ndryshon çdo vit; kontrollo udhëzimet zyrtare.",
      en: "You need citizenship of an eligible country, a high school education (12 years) or two years of qualifying work experience, and you must meet the other official requirements. Country eligibility changes each year; check the official instructions.",
    },
  },
  {
    q: {
      sq: "Çfarë ndodh nëse bëj një gabim në formular?",
      en: "What happens if I make a mistake?",
    },
    a: {
      sq: "Nëse aplikimi nuk është dorëzuar ende, mund të kthehesh dhe ta korrigjosh. Pas dorëzimit, përdor kërkesën për ndryshim në portal. Stafi e shqyrton dhe të kontakton; ndryshimet nuk aplikohen automatikisht.",
      en: "If the application has not been filed yet, you can go back and correct it. After submission, use the change request in the portal. Staff review it and contact you; changes are not applied automatically.",
    },
  },
  {
    q: {
      sq: "A mund të përfshij bashkëshortin/ën dhe fëmijët?",
      en: "Can I include my spouse and children?",
    },
    a: {
      sq: "Bashkëshorti/ja zakonisht duhet të përfshihet. Përjashtimet e mundshme (p.sh. shtetësi amerikane ose ndarje ligjërisht e dokumentuar) kërkojnë verifikim. Fëmijët e pamartuar nën 21 vjeç përfshihen, edhe nëse nuk emigrojnë.",
      en: "A spouse generally must be included. Possible exceptions (for example US citizenship or a documented legal separation) require verification. Unmarried children under 21 are included, even if they will not immigrate.",
    },
  },
  {
    q: {
      sq: "Çfarë kërkohet për fotografinë?",
      en: "What are the photo requirements?",
    },
    a: {
      sq: "JPEG ose PNG, katrore, 600×600 deri 1200×1200 piksel, me fytyrë të qartë dhe sfond të thjeshtë. Kontrolli automatik është këshillues; stafi vendos përfundimisht. Fotot nuk shfaqen publikisht.",
      en: "JPEG or PNG, square, 600×600 to 1200×1200 pixels, with a clearly visible face and a plain background. The automated check is advisory; staff make the final decision. Photos are never shown publicly.",
    },
  },
  {
    q: {
      sq: "Çfarë ndodh pas pagesës?",
      en: "What happens after payment?",
    },
    a: {
      sq: "Statusi i pagesës përditësohet në portal pasi stafi e konfirmon arkëtimin. Rasti kalon në kontroll, pastaj në radhën e dorëzimit. Dorëzimi bëhet vetëm gjatë periudhës zyrtare dhe numri i konfirmimit regjistrohet pas dorëzimit.",
      en: "The payment status updates in the portal after staff confirm receipt. The case moves to review, then to the filing queue. Filing happens only during the official period, and the confirmation number is recorded after filing.",
    },
  },
  {
    q: {
      sq: "A mund të anuloj ose të kërkoj rimbursim?",
      en: "Can I cancel or request a refund?",
    },
    a: {
      sq: "Kushtet e anulimit dhe rimbursimit nuk janë miratuar përfundimisht. Deri atëherë, dërgo kërkesën me shkrim në emailin e kontaktit dhe stafi e shqyrton rastin. Nuk premtojmë rimbursim automatik.",
      en: "Cancellation and refund terms are not final. Until then, send a written request to the contact email and staff will review the case. We do not promise an automatic refund.",
    },
  },
  {
    q: {
      sq: "A jeni të lidhur me qeverinë e SHBA-së?",
      en: "Are you affiliated with the US government?",
    },
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

  const base = [
    [t.home.faq1Q, t.home.faq1A],
    [t.home.faq2Q, t.home.faq2A],
    [t.home.faq3Q, t.home.faq3A],
    [t.home.faq4Q, t.home.faq4A],
    [t.home.faq5Q, t.home.faq5A],
    [t.home.faq6Q, t.home.faq6A],
    [t.home.faq7Q, t.home.faq7A],
    [t.home.faq8Q, t.home.faq8A],
  ];

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{t.legal.faqTitle}</p>
        <h1 className="mt-2 font-serif text-3xl tracking-[-0.02em] text-forest-900 sm:text-4xl">
          {t.home.faqTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {pick(
            locale,
            "Përgjigje të shkurtra për pyetjet më të zakonshme. Për rregullat zyrtare, udhëzimet e qeverisë kanë përparësi.",
            "Short answers to the most common questions. For official rules, the government instructions take precedence.",
          )}
        </p>

        <div className="mt-8 space-y-3">
          {base.map(([question, answer], index) => (
            <details
              key={`base-${index}`}
              className="group rounded-lg border border-line bg-white px-4 py-3.5 open:shadow-card"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none pr-6 text-[14px] font-semibold text-ink marker:hidden">
                {question}
              </summary>
              <p className="mt-2.5 text-[13px] leading-6 text-muted">{answer}</p>
            </details>
          ))}
          {EXTRA_FAQS.map((faq) => (
            <details key={faq.q.en} className="group rounded-lg border border-line bg-white px-4 py-3.5 open:shadow-card">
              <summary className="cursor-pointer list-none pr-6 text-[14px] font-semibold text-ink">
                {faq.q[locale]}
              </summary>
              <p className="mt-2.5 text-[13px] leading-6 text-muted">{faq.a[locale]}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-forest-200 bg-forest-50/60 p-5">
          <p className="text-[13px] font-semibold text-forest-900">{t.legal.disclaimerTitle}</p>
          <p className="mt-2 text-[12.5px] leading-6 text-forest-800/90">{t.home.disclosureBody}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/${locale}/apply`} className="btn-primary btn-sm">
              {t.home.ctaPrimary}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <a
              href={config.dv.instructionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-secondary btn-sm"
            >
              {t.home.officialLink}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
