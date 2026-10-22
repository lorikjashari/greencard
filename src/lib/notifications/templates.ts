import "server-only";

import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

export type EmailType =
  | "resume_link"
  | "portal_link"
  | "application_submitted"
  | "cash_instructions"
  | "payment_received"
  | "photo_rejected"
  | "info_requested"
  | "filing_complete"
  | "edit_request_received";

export interface EmailContext {
  name: string;
  reference: string;
  link?: string;
  amountCents?: number;
  confirmationNumber?: string;
  message?: string;
  tierLabel?: string;
}

const T: Record<EmailType, { subject: { sq: string; en: string } }> = {
  resume_link: { subject: { sq: "Vazhdo aplikimin tënd — {ref}", en: "Continue your application — {ref}" } },
  portal_link: { subject: { sq: "Lidhja e sigurt për portalin — {ref}", en: "Your secure portal link — {ref}" } },
  application_submitted: {
    subject: { sq: "Aplikimi u dorëzua — {ref}", en: "Application received — {ref}" },
  },
  cash_instructions: {
    subject: { sq: "Udhëzimet e pagesës — {ref}", en: "Payment instructions — {ref}" },
  },
  payment_received: { subject: { sq: "Pagesa u konfirmua — {ref}", en: "Payment confirmed — {ref}" } },
  photo_rejected: { subject: { sq: "Fotografia duhet zëvendësuar — {ref}", en: "Photo needs replacing — {ref}" } },
  info_requested: { subject: { sq: "Kërkohen të dhëna shtesë — {ref}", en: "More information needed — {ref}" } },
  filing_complete: {
    subject: { sq: "Aplikimi u dorëzua zyrtarisht — {ref}", en: "Application officially filed — {ref}" },
  },
  edit_request_received: {
    subject: { sq: "Kërkesa për ndryshim u prit — {ref}", en: "Change request received — {ref}" },
  },
};

function body(type: EmailType, locale: Locale, ctx: EmailContext): { heading: string; paragraphs: string[]; cta?: string } {
  const sq = locale === "sq";
  switch (type) {
    case "resume_link":
      return {
        heading: sq ? "Vazhdo aplikimin" : "Continue your application",
        paragraphs: [
          sq
            ? `Përshëndetje ${ctx.name}, ruajtëm progresin e aplikimit tënd. Lidhja skadon pas 30 minutash dhe përdoret vetëm një herë.`
            : `Hello ${ctx.name}, we saved your application progress. This link expires in 30 minutes and can be used once.`,
        ],
        cta: sq ? "Vazhdo aplikimin" : "Continue application",
      };
    case "portal_link":
      return {
        heading: sq ? "Hyr në portalin tënd" : "Sign in to your portal",
        paragraphs: [
          sq
            ? `Përshëndetje ${ctx.name}, kjo është lidhja e sigurt për të parë statusin e aplikimit ${ctx.reference}.`
            : `Hello ${ctx.name}, here is your secure link to view application ${ctx.reference}.`,
        ],
        cta: sq ? "Hap portalin" : "Open portal",
      };
    case "application_submitted":
      return {
        heading: sq ? "Aplikimi u dorëzua" : "Application received",
        paragraphs: [
          sq
            ? `Faleminderit, ${ctx.name}. Aplikimi yt me referencën ${ctx.reference} u regjistrua. Stafi do ta kontrollojë para dorëzimit në faqen zyrtare.`
            : `Thank you, ${ctx.name}. Your application with reference ${ctx.reference} has been recorded. Staff will review it before filing on the official site.`,
          sq
            ? "Nuk krijohet automatikisht një aplikim zyrtar qeveritar. Dorëzimi bëhet manualisht nga stafi."
            : "No official government entry is created automatically. Filing is performed manually by staff.",
        ],
        cta: sq ? "Shiko statusin" : "View status",
      };
    case "cash_instructions":
      return {
        heading: sq ? "Udhëzimet e pagesës" : "Payment instructions",
        paragraphs: [
          sq
            ? `Shuma: ${formatCurrency(ctx.amountCents ?? 0, "sq")}. Referenca: ${ctx.reference}. Përdor referencën në çdo pagesë.`
            : `Amount: ${formatCurrency(ctx.amountCents ?? 0, "en")}. Reference: ${ctx.reference}. Use the reference with every payment.`,
          sq
            ? ctx.message ?? "Aplikimi nuk dorëzohet në faqen zyrtare derisa pagesa të konfirmohet."
            : ctx.message ?? "The entry is not filed until payment is confirmed.",
        ],
        cta: sq ? "Shiko udhëzimet" : "View instructions",
      };
    case "payment_received":
      return {
        heading: sq ? "Pagesa u konfirmua" : "Payment confirmed",
        paragraphs: [
          sq
            ? `Konfirmuam pagesën për aplikimin ${ctx.reference}. Aplikimi vazhdon në kontrollin e stafit.`
            : `We confirmed payment for application ${ctx.reference}. Your case continues to staff review.`,
        ],
        cta: sq ? "Hap portalin" : "Open portal",
      };
    case "photo_rejected":
      return {
        heading: sq ? "Fotografia duhet zëvendësuar" : "Your photo needs replacing",
        paragraphs: [
          sq
            ? `Fotografia për aplikimin ${ctx.reference} nuk u pranua. Arsyeja: ${ctx.message ?? "nuk përputhet me kërkesat"}.`
            : `The photo for application ${ctx.reference} was not accepted. Reason: ${ctx.message ?? "does not meet requirements"}.`,
          sq ? "Hyr në portal për të ngarkuar një foto të re." : "Sign in to the portal to upload a new photo.",
        ],
        cta: sq ? "Ngarko foto" : "Upload photo",
      };
    case "info_requested":
      return {
        heading: sq ? "Kërkohen të dhëna shtesë" : "More information needed",
        paragraphs: [
          sq
            ? `Për aplikimin ${ctx.reference} na duhet: ${ctx.message ?? "informacion shtesë"}.`
            : `For application ${ctx.reference} we need: ${ctx.message ?? "additional information"}.`,
        ],
        cta: sq ? "Shiko aplikimin" : "View application",
      };
    case "filing_complete":
      return {
        heading: sq ? "Aplikimi u dorëzua zyrtarisht" : "Application officially filed",
        paragraphs: [
          sq
            ? `Aplikimi ${ctx.reference} u dorëzua në faqen zyrtare. Numri i konfirmimit: ${ctx.confirmationNumber}. Ruaje në vend të sigurt.`
            : `Application ${ctx.reference} was filed on the official site. Confirmation number: ${ctx.confirmationNumber}. Keep it safe.`,
          sq
            ? "Numri i konfirmimit është i vetmi dokument që të lejon të kontrollosh rezultatin në faqen zyrtare."
            : "The confirmation number is the only document that lets you check the result on the official site.",
        ],
        cta: sq ? "Shiko në portal" : "View in portal",
      };
    case "edit_request_received":
      return {
        heading: sq ? "Kërkesa u prit" : "Request received",
        paragraphs: [
          sq
            ? `Pritëm kërkesën për ndryshim për aplikimin ${ctx.reference}. Stafi do të kontaktojë.`
            : `We received the change request for application ${ctx.reference}. Staff will follow up.`,
        ],
      };
    default:
      return { heading: "Notification", paragraphs: [] };
  }
}

export function renderEmail(
  type: EmailType,
  locale: Locale,
  ctx: EmailContext,
): { subject: string; html: string; text: string } {
  const content = body(type, locale, ctx);
  const subject = T[type].subject[locale].replace("{ref}", ctx.reference).replace(/[\r\n]+/g, " ");
  const sq = locale === "sq";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = ctx.link ? (ctx.link.startsWith("http") ? ctx.link : `${appUrl}${ctx.link}`) : null;
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const footer = sq
    ? "Green Card Kosova është shërbim privat dhe nuk ka lidhje me Qeverinë e SHBA-së. Aplikimi zyrtar DV është falas në faqen zyrtare. Askush nuk mund të garantojë përzgjedhje."
    : "Green Card Kosova is a private service and is not affiliated with the US government. The official DV entry is free on the government site. No one can guarantee selection.";

  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#F7F6F1;font-family:Arial,Helvetica,sans-serif;color:#202824;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#153D32;font-weight:700;padding:8px 0 20px;">Green Card Kosova</div>
      <div style="background:#ffffff;border:1px solid #E3E7E1;border-radius:10px;padding:28px;">
        <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#102E26;">${escapeHtml(content.heading)}</h1>
        ${content.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#33403A;">${escapeHtml(p)}</p>`).join("")}
        ${link && content.cta ? `<p style="margin:24px 0 8px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#153D32;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;">${escapeHtml(content.cta)}</a></p><p style="font-size:12px;color:#68716B;word-break:break-all;">${escapeHtml(link)}</p>` : ""}
      </div>
      <p style="font-size:11px;line-height:1.6;color:#68716B;margin:18px 4px 0;">${escapeHtml(footer)}</p>
    </div>
  </body>
</html>`;

  const text = [
    "Green Card Kosova",
    "",
    content.heading,
    "",
    ...content.paragraphs,
    link ? `\n${content.cta ?? "Link"}: ${link}` : "",
    "",
    footer,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
