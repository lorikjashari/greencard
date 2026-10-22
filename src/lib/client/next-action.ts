import type { Locale } from "@/lib/i18n";
import type { ApplicationRecord, OrderRecord } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function nextActionFor(
  application: ApplicationRecord,
  order: OrderRecord | null,
  locale: Locale,
): { title: string; body: string; needsClient: boolean } {
  const sq = locale === "sq";

  if (application.status === "needs_information") {
    return {
      title: sq ? "Duhet veprim nga ti" : "Action needed from you",
      body:
        application.statusReason?.trim() ||
        (sq
          ? "Stafi ka kërkuar informacion shtesë. Shiko shënimet dhe përditëso të dhënat."
          : "Staff requested additional information. Check the notes and update your details."),
      needsClient: true,
    };
  }

  if (
    (application.paymentStatus === "pending_cash" || application.paymentStatus === "created") &&
    application.status !== "cancelled" &&
    application.status !== "rejected"
  ) {
    return {
      title: sq ? "Plotëso pagesën" : "Complete your payment",
      body: sq
        ? `Paguaj ${order ? `me referencën ${order.ref}` : "sipas udhëzimeve"} para ${formatDate(order?.expiresAt, locale)}. Aplikimi nuk dorëzohet zyrtarisht derisa pagesa të konfirmohet.`
        : `Pay ${order ? `using reference ${order.ref}` : "using the instructions"} before ${formatDate(order?.expiresAt, locale)}. The entry is not filed until payment is confirmed.`,
      needsClient: true,
    };
  }

  if (application.status === "submitted" || application.status === "in_review") {
    return {
      title: sq ? "Në kontroll nga stafi" : "Under staff review",
      body: sq
        ? "Nuk kërkohet veprim tani. Kontrollojmë të dhënat dhe fotot; të kontaktojmë nëse duhet diçka."
        : "No action needed right now. We are checking your details and photos and will contact you if anything is needed.",
      needsClient: false,
    };
  }

  if (application.status === "ready_to_file") {
    return {
      title: sq ? "Gati për dorëzim" : "Ready to file",
      body: sq
        ? "Pagesa është konfirmuar dhe rasti është gati. Dorëzimi në faqen zyrtare bëhet nga stafi gjatë dritares zyrtare."
        : "Payment is confirmed and the case is ready. Staff will file it on the official site during the official window.",
      needsClient: false,
    };
  }

  if (application.status === "filed" || application.status === "confirmation_sent") {
    return {
      title: sq ? "Aplikimi u dorëzua zyrtarisht" : "Entry filed",
      body: sq
        ? "Ruaj numrin e konfirmimit. Njoftimet e mëtejshme vijnë nga faqja zyrtare; ne nuk garantojmë përzgjedhje."
        : "Keep your confirmation number. Further notices come from the official site; we cannot guarantee selection.",
      needsClient: false,
    };
  }

  if (application.status === "selected") {
    return {
      title: sq ? "U përzgjodh" : "Selected",
      body: sq
        ? "Ky është hapi i parë. Ndjek udhëzimet zyrtare për dokumentet dhe intervistën; nuk ofrojmë garanci për vizë."
        : "This is the first step. Follow the official instructions for documents and the interview; we do not guarantee a visa.",
      needsClient: false,
    };
  }

  if (application.status === "not_selected") {
    return {
      title: sq ? "Nuk u përzgjodh" : "Not selected",
      body: sq
        ? "Lotaria nuk zgjodhi këtë aplikim. Nuk ka veprim të mëtejshëm në këtë cikël."
        : "This entry was not selected. There is no further action in this cycle.",
      needsClient: false,
    };
  }

  return {
    title: sq ? "Kontakto zyrën" : "Contact the office",
    body: sq
      ? "Për statusin aktual të këtij rasti, shkruaj në emailin e kontaktit."
      : "For the current status of this case, write to the contact email.",
    needsClient: true,
  };
}
