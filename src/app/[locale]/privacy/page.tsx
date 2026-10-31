import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { getPublicConfig } from "@/lib/config";
import { LEGAL_CONTROLLER, POLICY_VERSION, RETENTION_MONTHS } from "@/lib/policy";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const metadata: Metadata = {
  title: "Politika e Privatësisë",
  description: "Si mblidhen, përdoren dhe mbrohen të dhënat personale në Green Card Kosova. Draft në pritje të miratimit ligjor.",
};

const SECTIONS: LegalSection[] = [
  {
    title: { sq: "Kush është kontrolluesi", en: "Who is the controller" },
    paragraphs: [
      {
        sq: `${LEGAL_CONTROLLER} është kontrolluesi i të dhënave për këtë faqe dhe shërbimin e përgatitjes së aplikimeve DV. Green Card Kosova është shërbim privat dhe nuk përfaqëson Qeverinë e Shteteve të Bashkuara.`,
        en: `${LEGAL_CONTROLLER} is the data controller for this website and the DV application preparation service. Green Card Kosova is a private service and does not represent the United States government.`,
      },
      {
        sq: "Kontaktet për çështje të të dhënave janë në fund të këtij dokumenti. Nëse kërkesa lidhet me një aplikim konkret, përfshi numrin e referencës.",
        en: "Data-protection contacts are at the end of this document. If a request concerns a specific application, include the reference number.",
      },
    ],
  },
  {
    title: { sq: "Të dhënat që mbledhim", en: "Data we collect" },
    paragraphs: [
      {
        sq: "Për të përgatitur aplikimin: emri, emri i mesëm, mbiemri, data dhe vendi i lindjes, shtetësia, gjinia, niveli i arsimit, statusi martesor, të dhënat e bashkëshortit/kes dhe fëmijëve, të dhënat e kontaktit dhe përgjigjet e tjera që jep në formular.",
        en: "To prepare the application: first, middle and last name, date and place of birth, nationality, gender, education level, marital status, spouse and children details, contact details and the other answers you provide in the form.",
      },
      {
        sq: "Fotografitë që ngarkoni për aplikantin, bashkëshortin/ën dhe fëmijët. Fotografitë mund të përmbajnë të dhëna biometrike; ato përdoren vetëm për përgatitjen dhe dorëzimin e aplikimit dhe për kontrollin e cilësisë.",
        en: "Photos you upload for the applicant, spouse and children. Photos may contain biometric data; they are used only to prepare and file the application and for quality review.",
      },
      {
        sq: "Të dhëna për pagesën: metoda, shuma, referenca, data e arkëtimit dhe shënime rakordimi. Në modalitetin me para në dorë nuk ruajmë të dhëna karte. Kur pagesa me kartë aktivizohet, të dhënat e kartës procesohen nga ofruesi i pagesave dhe nuk ruhen në këtë faqe.",
        en: "Payment data: method, amount, reference, receipt date and reconciliation notes. In cash mode we do not store card data. When card payment is enabled, card details are processed by the payment provider and are not stored on this site.",
      },
      {
        sq: "Komunikimet me stafin, kërkesat për ndryshim ose të dhëna, regjistrat e auditimit dhe të dhëna teknike të nevojshme për sigurinë (p.sh. kohët e aksesit). Regjistrat e biznesit nuk ruajnë adresën IP të plotë; për kufizimin e tentativave përdoret një adresë e përkohshme.",
        en: "Communications with staff, change or data requests, audit records and technical data needed for security (for example access times). Business logs do not store full IP addresses; rate limiting uses a temporary address.",
      },
    ],
  },
  {
    title: { sq: "Përse dhe mbi çfarë baze", en: "Why and on what basis" },
    paragraphs: [
      {
        sq: "Për të kryer shërbimin që kërkoni (përgatitja, kontrolli, dorëzimi dhe mbështetja), për të përmbushur detyrime ligjore (p.sh. kontabilitet dhe tatime) dhe për interesa të ligjshme si siguria e sistemit dhe parandalimi i mashtrimit.",
        en: "To provide the service you request (preparation, review, filing and support), to meet legal obligations (for example accounting and tax) and for legitimate interests such as system security and fraud prevention.",
      },
      {
        sq: "Për përpunime që kërkojnë pëlqim (p.sh. komunikime marketingu, nëse ofrohen në të ardhmen), pëlqimi jepet veçmas dhe mund të tërhiqet. Pëlqimi për përpunimin e të dhënave të fëmijëve jepet nga prindi ose kujdestari ligjor.",
        en: "For processing that requires consent (for example marketing communications, if offered in the future), consent is given separately and can be withdrawn. Consent for children's data is given by the parent or legal guardian.",
      },
    ],
  },
  {
    title: { sq: "Fotografitë dhe konfidencialiteti", en: "Photos and confidentiality" },
    paragraphs: [
      {
        sq: "Fotografitë ruhen në hapësirë private, me akses sipas rolit. Nuk shfaqen publikisht dhe nuk shiten. Vetëm stafi i autorizuar dhe, kur është e nevojshme për mirëmbajtje, administratorë të kufizuar mund t'i shohin.",
        en: "Photos are stored in private storage with role-based access. They are not shown publicly and are not sold. Only authorised staff and, where necessary for maintenance, limited administrators can view them.",
      },
      {
        sq: "Kontrolli automatik i përmasave dhe formatit është këshillues. Vendimi për pranim ose refuzim merret nga stafi; nuk ka vendim automatik me efekt ligjor.",
        en: "The automated dimension and format check is advisory. Staff decide whether to accept or reject a photo; there is no automated decision with legal effect.",
      },
    ],
  },
  {
    title: { sq: "Ofruesit dhe transferimet", en: "Processors and transfers" },
    paragraphs: [
      {
        sq: "Shërbimi përdor Neon (PostgreSQL) për bazën e të dhënave, ruajtjen e fotove dhe tokenat e hyrjes, ofrues emaili për lidhjet e hyrjes dhe njoftimet dhe, nëse aktivizohet, ofrues pagesash për kartat. Këta ofrues përpunojnë të dhëna vetëm sipas udhëzimeve dhe marrëveshjeve përkatëse.",
        en: "The service uses Neon (PostgreSQL) for the database, photo storage and sign-in tokens, an email provider for sign-in links and notifications and, if enabled, a payment provider for cards. These providers process data only under the relevant instructions and agreements.",
      },
      {
        sq: "Disa ofrues mund të përpunojnë të dhëna jashtë Kosovës. Transferimet ndërkombëtare dhe garancitë e nevojshme (p.sh. klauzola kontraktuale standarde) duhet të konfirmohen në marrëveshjet me ofruesit para nisjes; kjo çështje është ende në shqyrtim.",
        en: "Some providers may process data outside Kosovo. International transfers and the required safeguards (for example standard contractual clauses) must be confirmed in provider agreements before launch; this is still under review.",
      },
      {
        sq: "Në modalitetin demo, të dhënat ruhen në serverin lokal të aplikacionit dhe email-et nuk dërgohen. Demo nuk është mjedis prodhimi.",
        en: "In demo mode, data is stored on the application's local server and emails are not delivered. Demo is not a production environment.",
      },
    ],
  },
  {
    title: { sq: "Sa kohë i mbajmë", en: "How long we keep data" },
    paragraphs: [
      {
        sq: "Afatet e ruajtjes nuk janë miratuar përfundimisht. Propozimi aktual, që pret miratim, është: aplikimet 24 muaj, fotografitë 12 muaj, të dhënat e pagesave 84 muaj, regjistrat e auditimit 60 muaj dhe njoftimet 12 muaj. Këto afate mund të ndryshojnë sipas detyrimeve ligjore.",
        en: "Retention periods are not final. The current proposal, pending approval, is: applications 24 months, photos 12 months, payment records 84 months, audit logs 60 months and notifications 12 months. These periods may change according to legal obligations.",
      },
      {
        sq: `Për qëllime transparence, vlerat e propozuara në kod janë: aplikime ${RETENTION_MONTHS.applications} muaj, foto ${RETENTION_MONTHS.photos} muaj, pagesa ${RETENTION_MONTHS.paymentRecords} muaj, auditim ${RETENTION_MONTHS.auditLogs} muaj, njoftime ${RETENTION_MONTHS.notifications} muaj.`,
        en: `For transparency, the proposed values in the code are: applications ${RETENTION_MONTHS.applications} months, photos ${RETENTION_MONTHS.photos} months, payments ${RETENTION_MONTHS.paymentRecords} months, audit ${RETENTION_MONTHS.auditLogs} months, notifications ${RETENTION_MONTHS.notifications} months.`,
      },
      {
        sq: "Mund të kërkosh fshirjen më herët; kërkesa shqyrtohet duke marrë parasysh detyrimet ligjore dhe provat e nevojshme për mosmarrëveshje.",
        en: "You may request earlier deletion; the request is reviewed in light of legal obligations and evidence needed for disputes.",
      },
    ],
  },
  {
    title: { sq: "Të drejtat e tua", en: "Your rights" },
    paragraphs: [
      {
        sq: "Mund të kërkosh akses, korrigjim, fshirje, kufizim ose kundërshtim të përpunimit, dhe tërheqje të pëlqimit. Në portal mund të dërgosh kërkesë për të dhënat ose për ndryshim. Për kërkesa të tjera përdor kontaktin zyrtar.",
        en: "You may request access, correction, deletion, restriction or objection to processing, and withdraw consent. In the portal you can submit a data or change request. For other requests use the official contact.",
      },
      {
        sq: "Mund të ankohesh pranë Agjencisë për Informim dhe Privatësi të Kosovës. Nëse baza është pëlqimi, tërheqja nuk prek ligjshmërinë e përpunimit para tërheqjes.",
        en: "You may complain to the Kosovo Agency for Information and Privacy. Where the basis is consent, withdrawal does not affect the lawfulness of processing before withdrawal.",
      },
    ],
  },
  {
    title: { sq: "Siguria", en: "Security" },
    paragraphs: [
      {
        sq: "Përdorim lidhje të kriptuar (HTTPS), sesione të nënshkruara, lidhje njëpërdorimshe për portalin, fjalëkalime sekrete të ruajtura si hash, kufizim të tentativave dhe regjistrim të veprimeve të stafit. Asnjë sistem nuk është plotësisht i sigurt; nëse vëren një problem, na kontakto menjëherë.",
        en: "We use encrypted connections (HTTPS), signed sessions, single-use portal links, hashed draft secrets, rate limiting and staff action logging. No system is perfectly secure; if you notice a problem, contact us immediately.",
      },
    ],
  },
  {
    title: { sq: "Ndryshimet dhe kontakti", en: "Changes and contact" },
    paragraphs: [
      {
        sq: "Ky draft do të zëvendësohet me versionin final pas miratimit ligjor. Ndryshimet materiale do të shfaqen në këtë faqe me version të ri.",
        en: "This draft will be replaced by the final version after legal approval. Material changes will appear on this page with a new version.",
      },
    ],
  },
];

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);
  const config = getPublicConfig();

  return (
    <LegalDocument
      locale={locale}
      t={t}
      title={t.legal.privacyTitle}
      intro={
        locale === "sq"
          ? "Ky dokument shpjegon si mblidhen dhe përdoren të dhënat personale kur përdor faqen, formularin dhe portalin e Green Card Kosova."
          : "This document explains how personal data is collected and used when you use the Green Card Kosova website, form and portal."
      }
      sections={SECTIONS}
      version={POLICY_VERSION}
      contactEmail={config.contact.email}
      address={config.contact.address}
    />
  );
}
