import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { getPublicConfig } from "@/lib/config";
import { LEGAL_CONTROLLER, POLICY_VERSION } from "@/lib/policy";
import { isLocale, type Locale } from "@/lib/i18n";
import { copy } from "@/messages/get";

export const metadata: Metadata = {
  title: "Shënim mbi pavarësinë",
  description: "Green Card Kosova është shërbim privat, i pavarur nga Qeveria e SHBA-së. Regjistrimi zyrtar DV është falas.",
};

const SECTIONS: LegalSection[] = [
  {
    title: { sq: "Shërbim privat dhe i pavarur", en: "A private, independent service" },
    paragraphs: [
      {
        sq: `${LEGAL_CONTROLLER} është biznes privat në Kosovë. Nuk jemi pjesë, agjenci ose përfaqësues i Qeverisë së Shteteve të Bashkuara, i Ambasadës amerikane ose i programit zyrtar DV.`,
        en: `${LEGAL_CONTROLLER} is a private business in Kosovo. We are not part of, an agency of, or a representative of the United States government, the US Embassy or the official DV program.`,
      },
    ],
  },
  {
    title: { sq: "Regjistrimi zyrtar është falas", en: "The official entry is free" },
    paragraphs: [
      {
        sq: "Aplikimi zyrtar për Lotarinë e Vizave të Diversitetit bëhet vetëm në faqen zyrtare të qeverisë dhe është falas. Tarifa jonë është për shërbimin e përgatitjes, kontrollit dhe dorëzimit që ofrojmë ne, jo për një tarifë qeveritare.",
        en: "The official Diversity Visa entry is made only on the government's official website and is free. Our fee is for the preparation, review and filing service we provide, not a government fee.",
      },
      {
        sq: "Nuk kërkojmë dhe nuk pranojmë pagesa në emër të qeverisë. Pagesat për shërbimin tonë bëhen sipas udhëzimeve në faqen tonë dhe në portal.",
        en: "We do not request or accept payments on behalf of the government. Payments for our service are made according to the instructions on our site and in the portal.",
      },
    ],
  },
  {
    title: { sq: "Asnjë garanci për përzgjedhje ose vizë", en: "No guarantee of selection or a visa" },
    paragraphs: [
      {
        sq: "Përzgjedhja bëhet rastësisht nga sistemi zyrtar. Askush nuk mund të garantojë përzgjedhje, intervistë, vizë ose ndonjë rezultat tjetër. Çdo pretendim i tillë duhet trajtuar me kujdes.",
        en: "Selection is random and carried out by the official system. No one can guarantee selection, an interview, a visa or any other outcome. Any such claim should be treated with caution.",
      },
    ],
  },
  {
    title: { sq: "Nuk ofrojmë këshillim ligjor", en: "We do not provide legal advice" },
    paragraphs: [
      {
        sq: "Informacioni në këtë faqe është i përgjithshëm dhe nuk përbën këshillë ligjore ose imigrimi. Për çështje komplekse, konsulto një avokat të licencuar ose burimet zyrtare.",
        en: "The information on this site is general and does not constitute legal or immigration advice. For complex matters, consult a licensed lawyer or official sources.",
      },
    ],
  },
  {
    title: { sq: "Saktësia e informacionit dhe datat", en: "Accuracy of information and dates" },
    paragraphs: [
      {
        sq: "Përpiqemi të mbajmë informacionin të saktë, por kërkesat dhe afatet zyrtare mund të ndryshojnë pa njoftim. Datat dhe rregullat duhet të verifikohen në udhëzimet zyrtare për vitin përkatës para çdo veprimi.",
        en: "We try to keep information accurate, but official requirements and deadlines can change without notice. Dates and rules must be verified in the official instructions for the relevant year before taking action.",
      },
    ],
  },
  {
    title: { sq: "Fotografitë dhe përgjegjësia e klientit", en: "Photos and client responsibility" },
    paragraphs: [
      {
        sq: "Kontrolli automatik i fotografive nuk verifikon me siguri identitetin, fytyrën ose përputhshmërinë me të gjitha rregullat. Klienti mbetet përgjegjës për saktësinë e të dhënave dhe për të drejtën e përdorimit të fotografive të personave të tjerë.",
        en: "The automated photo check does not reliably verify identity, facial features or compliance with every rule. The client remains responsible for the accuracy of the data and for having the right to use other people's photos.",
      },
    ],
  },
];

export default async function DisclaimerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = copy(locale);
  const config = getPublicConfig();

  return (
    <LegalDocument
      locale={locale}
      t={t}
      title={t.legal.disclaimerTitle}
      intro={
        locale === "sq"
          ? "Ky shënim përmbledh pavarësinë e shërbimit dhe kufijtë e asaj që mund të premtojmë."
          : "This notice summarises the independence of the service and the limits of what we can promise."
      }
      sections={SECTIONS}
      version={POLICY_VERSION}
      contactEmail={config.contact.email}
      address={config.contact.address}
    />
  );
}
