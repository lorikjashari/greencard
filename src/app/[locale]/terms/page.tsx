import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { getPublicConfig } from "@/lib/config";
import { LEGAL_CONTROLLER, POLICY_VERSION } from "@/lib/policy";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const metadata: Metadata = {
  title: "Kushtet e Shërbimit",
  description: "Kushtet e shërbimit për përgatitjen dhe dorëzimin e aplikimeve DV. Draft në pritje të miratimit ligjor.",
};

const SECTIONS: LegalSection[] = [
  {
    title: { sq: "Shërbimi", en: "The service" },
    paragraphs: [
      {
        sq: `${LEGAL_CONTROLLER} ofron një shërbim privat për përgatitjen, kontrollin dhe dorëzimin e aplikimeve për Lotarinë e Vizave të Diversitetit (DV), së bashku me mbështetje dhe një portal për ndjekjen e statusit.`,
        en: `${LEGAL_CONTROLLER} provides a private service for preparing, reviewing and filing Diversity Visa (DV) applications, together with support and a portal for tracking status.`,
      },
      {
        sq: "Regjistrimi zyrtar DV është falas dhe bëhet në faqen e qeverisë. Ne nuk jemi agjenci qeveritare dhe nuk marrim pjesë në përzgjedhje. Shërbimi nuk përfshin këshillim ligjor ose imigrimi.",
        en: "The official DV entry is free and is made on the government website. We are not a government agency and do not take part in the selection. The service does not include legal or immigration advice.",
      },
    ],
  },
  {
    title: { sq: "Asnjë garanci rezultati", en: "No outcome guarantee" },
    paragraphs: [
      {
        sq: "Askush nuk mund të garantojë përzgjedhje, ftesë për intervistë, vizë ose ndonjë rezultat tjetër imigrimi. Ne përgjigjemi për cilësinë e punës sonë, jo për vendimet e qeverisë.",
        en: "No one can guarantee selection, an interview invitation, a visa or any other immigration outcome. We are responsible for the quality of our work, not for government decisions.",
      },
      {
        sq: "Kërkesat, datat dhe procedurat mund të ndryshojnë. Udhëzimet zyrtare të programit DV kanë përparësi mbi çdo informacion në këtë faqe.",
        en: "Requirements, dates and procedures can change. The official DV program instructions take precedence over any information on this site.",
      },
    ],
  },
  {
    title: { sq: "Përgjegjësitë e klientit", en: "Client responsibilities" },
    paragraphs: [
      {
        sq: "Duhet të japësh informacion të saktë, të plotë dhe të vërtetë, dhe të ngarkosh fotografi që të përfaqësojnë personat në aplikim. Je përgjegjës për saktësinë e të dhënave dhe për plotësimin e kërkesave shtesë brenda afateve.",
        en: "You must provide accurate, complete and truthful information and upload photos that depict the people in the application. You are responsible for the accuracy of the data and for responding to requests within the deadlines.",
      },
      {
        sq: "Duhet të kesh të drejtë të aplikosh sipas rregullave zyrtare, përfshirë kriterin e shtetit të lindjes dhe arsimit ose përvojës së punës. Nëse nuk plotëson kriteret, nuk duhet të dorëzosh aplikimin.",
        en: "You must be eligible under the official rules, including country-of-birth and education or work-experience criteria. If you do not meet the criteria, you should not submit an application.",
      },
    ],
  },
  {
    title: { sq: "Paketat dhe çmimet", en: "Packages and prices" },
    paragraphs: [
      {
        sq: "Çmimet janë: Individual 12,50 €, Çifte 17,50 € dhe Familjar 27,50 € për aplikim. Paketa përcaktohet nga përbërja e familjes që deklaron në formular dhe fiksohet në momentin e dorëzimit; nuk zgjidhet manualisht nga klienti.",
        en: "Prices are: Individual €12.50, Couple €17.50 and Family €27.50 per application. The package is determined by the household composition you declare in the form and is fixed at submission; it is not manually selected by the client.",
      },
      {
        sq: "Nuk aplikohet aktualisht një tarifë shtesë pas përzgjedhjes. Çdo tarifë e tillë e ardhshme do të kërkonte informim të qartë dhe pranim të veçantë para se të faturohej.",
        en: "No post-selection fee currently applies. Any such future fee would require clear disclosure and separate acceptance before being charged.",
      },
    ],
  },
  {
    title: { sq: "Pagesa dhe afatet", en: "Payment and deadlines" },
    paragraphs: [
      {
        sq: "Metoda standarde është pagesa me para në dorë ose me postë, sipas udhëzimeve që shfaqen pas dorëzimit. Pagesa me kartë ofrohet vetëm kur ofruesi i pagesave është konfiguruar; deri atëherë opsioni është i çaktivizuar.",
        en: "The default method is cash in person or by post, following the instructions shown after submission. Card payment is offered only when a payment provider is configured; until then the option is disabled.",
      },
      {
        sq: "Aplikimi nuk dorëzohet në faqen zyrtare derisa pagesa të konfirmohet dhe rasti të kalojë kontrollin. Afati i pagesës shfaqet në portal. Vonesat mund të shkaktojnë humbjen e periudhës zyrtare të regjistrimit.",
        en: "The entry is not filed on the official site until payment is confirmed and the case passes review. The payment deadline is shown in the portal. Delays may cause the official registration period to be missed.",
      },
      {
        sq: "Nëse shuma e arkëtuar nuk përputhet me porosinë, stafi regjistron mospërputhjen dhe të kontakton para se të vazhdojë.",
        en: "If the amount received does not match the order, staff record the mismatch and contact you before proceeding.",
      },
    ],
  },
  {
    title: { sq: "Anulimi dhe rimbursimi", en: "Cancellation and refunds" },
    paragraphs: [
      {
        sq: "Kushtet e anulimit dhe rimbursimit nuk janë miratuar përfundimisht. Deri në miratim, kërkesat shqyrtohen individualisht me shkrim, duke marrë parasysh punën e kryer, pagesat e palëve të treta dhe detyrimet ligjore. Nuk ka premtim për rimbursim automatik.",
        en: "Cancellation and refund terms are not final. Until approved, requests are reviewed individually in writing, taking into account work performed, third-party costs and legal obligations. There is no promise of an automatic refund.",
      },
      {
        sq: "Kur shërbimi fillon menjëherë me kërkesën tënde, e drejta e tërheqjes mund të humbasë pasi aplikimi të dorëzohet në faqen zyrtare. Kjo nuk prek të drejtat e detyrueshme që nuk mund të përjashtohen me ligj.",
        en: "Where the service starts immediately at your request, the right of withdrawal may be lost once the entry is filed on the official site. This does not affect mandatory rights that cannot be excluded by law.",
      },
    ],
  },
  {
    title: { sq: "Periudha zyrtare dhe dorëzimi", en: "Official window and filing" },
    paragraphs: [
      {
        sq: "Dorëzimi bëhet vetëm gjatë periudhës zyrtare të regjistrimit dhe vetëm pasi pagesa konfirmohet dhe kontrolli përfundon. Numri i konfirmimit regjistrohet pas dorëzimit dhe shfaqet në portal; nuk shfaqet më herët.",
        en: "Filing takes place only during the official registration period and only after payment is confirmed and review is complete. The confirmation number is recorded after filing and shown in the portal; it never appears earlier.",
      },
      {
        sq: "Nëse dorëzimi pengohet nga vonesa e klientit, mungesa e dokumenteve, pagesa e pakonfirmuar ose ndryshime qeveritare, ne njoftojmë dhe dokumentojmë arsyen. Nuk garantojmë dorëzim nëse kushtet nuk plotësohen brenda afatit.",
        en: "If filing is prevented by client delay, missing documents, unconfirmed payment or government changes, we notify you and document the reason. We cannot guarantee filing if the conditions are not met within the deadline.",
      },
    ],
  },
  {
    title: { sq: "Përdorimi i lejuar", en: "Acceptable use" },
    paragraphs: [
      {
        sq: "Nuk lejohet dorëzimi i informacionit të rremë, i dokumenteve të falsifikuara, i fotografive të personave të tjerë pa autorizim ose i përmbajtjes që cenon të drejtat e të tjerëve. Raste të tilla mund të çojnë në refuzim të shërbimit dhe raportim sipas ligjit.",
        en: "Submitting false information, forged documents, photos of other people without authorisation or content that infringes the rights of others is not allowed. Such cases may lead to refusal of service and reporting as required by law.",
      },
    ],
  },
  {
    title: { sq: "Përgjegjësia", en: "Liability" },
    paragraphs: [
      {
        sq: "Kufizimet e përgjegjësisë do të finalizohen pas rishikimit ligjor. Asgjë në këto kushte nuk përjashton përgjegjësinë që nuk mund të përjashtohet sipas ligjit të zbatueshëm, përfshirë mashtrimin ose dëmtimin e qëllimshëm.",
        en: "Liability limits will be finalised after legal review. Nothing in these terms excludes liability that cannot be excluded under applicable law, including fraud or intentional harm.",
      },
    ],
  },
  {
    title: { sq: "Privatësia dhe ligji", en: "Privacy and governing law" },
    paragraphs: [
      {
        sq: "Përpunimi i të dhënave përshkruhet në Politikën e Privatësisë. Këto kushte synohet të rregullohen nga ligji i Kosovës; klauzola për zgjidhjen e mosmarrëveshjeve dhe gjykata kompetente pret konfirmim ligjor.",
        en: "Data processing is described in the Privacy Policy. These terms are intended to be governed by the law of Kosovo; the dispute-resolution clause and competent court are pending legal confirmation.",
      },
    ],
  },
];

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);
  const config = getPublicConfig();

  return (
    <LegalDocument
      locale={locale}
      t={t}
      title={t.legal.termsTitle}
      intro={
        locale === "sq"
          ? "Këto kushte përshkruajnë marrëdhënien mes teje dhe Green Card Kosova kur përdor faqen dhe shërbimin e përgatitjes së aplikimit DV."
          : "These terms describe the relationship between you and Green Card Kosova when you use the site and the DV application preparation service."
      }
      sections={SECTIONS}
      version={POLICY_VERSION}
      contactEmail={config.contact.email}
      address={config.contact.address}
    />
  );
}
