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

  const reference =
    ctx.reference && ctx.reference !== "—" && ctx.reference !== "-" ? ctx.reference : null;
  const isLink = Boolean(link && content.cta);
  const expiry = type === "resume_link" || type === "portal_link" ? 30 : null;

  const eyebrow =
    type === "portal_link" || type === "resume_link"
      ? sq
        ? "Portali i aplikantit"
        : "Applicant portal"
      : type === "cash_instructions" || type === "payment_received"
        ? sq
          ? "Pagesa"
          : "Payment"
        : type === "filing_complete"
          ? sq
            ? "Dorëzimi zyrtar"
            : "Official filing"
          : type === "photo_rejected" || type === "info_requested"
            ? sq
              ? "Veprim i nevojshëm"
              : "Action needed"
            : type === "application_submitted"
              ? sq
                ? "Konfirmim"
                : "Confirmation"
              : sq
                ? "Njoftim"
                : "Notice";

  const securityNote = isLink
    ? sq
      ? "Për siguri, lidhja skadon dhe përdoret vetëm një herë. Nëse nuk e kërkove këtë email, injoroje."
      : "For your security, this link expires and can be used once. If you did not request this email, ignore it."
    : null;

  const html = `<!doctype html>
<html lang="${locale}" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F4F1E8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.heading)}${reference ? ` · ${escapeHtml(reference)}` : ""}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F1E8;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="background:#0F2E26;border-radius:14px 14px 0 0;padding:26px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:bold;color:#F4F1E8;">Green Card Kosova</td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C5A56A;">DV Lottery Service</td>
                  </tr>
                </table>
                <div style="height:2px;width:44px;background:#C5A56A;margin-top:16px;font-size:0;line-height:0;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;border-left:1px solid #E4E1D6;border-right:1px solid #E4E1D6;padding:34px 32px 8px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#8A6D3B;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:10px 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.28;color:#102E26;font-weight:normal;">${escapeHtml(content.heading)}</h1>
                ${content.paragraphs.map((p) => `<p style="margin:0 0 15px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#33403A;">${escapeHtml(p)}</p>`).join("")}
                ${
                  reference
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:#F7F5EC;border:1px solid #E7E2D2;border-radius:10px;">
                        <tr>
                          <td style="padding:14px 18px;">
                            <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8A6D3B;">${sq ? "Referenca" : "Reference"}</div>
                            <div style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:bold;color:#153D32;letter-spacing:1px;margin-top:4px;">${escapeHtml(reference)}</div>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
                ${
                  isLink
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
                        <tr>
                          <td align="center" bgcolor="#153D32" style="border-radius:8px;">
                            <a href="${escapeHtml(link!)}" style="display:block;padding:15px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${escapeHtml(content.cta!)}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#6B7670;word-break:break-all;">${sq ? "Nëse butoni nuk hapet, kopjo këtë lidhje:" : "If the button does not open, copy this link:"}<br><a href="${escapeHtml(link!)}" style="color:#153D32;">${escapeHtml(link!)}</a></p>
                      ${expiry ? `<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#8A6D3B;">${sq ? `Lidhja skadon pas ${expiry} minutash.` : `This link expires in ${expiry} minutes.`}</p>` : ""}`
                    : ""
                }
                ${securityNote ? `<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#6B7670;">${escapeHtml(securityNote)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;border:1px solid #E4E1D6;border-top:0;border-radius:0 0 14px 14px;padding:0 32px 30px;">
                <div style="border-top:1px solid #EDEAE0;margin-top:20px;padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6B7670;">${escapeHtml(footer)}</div>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.6;color:#8A918B;">&copy; ${new Date().getFullYear()} Green Card Kosova</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "GREEN CARD KOSOVA",
    "-----------------------------",
    "",
    content.heading.toUpperCase(),
    "",
    ...content.paragraphs,
    reference ? `\n${sq ? "Referenca" : "Reference"}: ${reference}` : "",
    link ? `\n${content.cta ?? "Link"}:\n${link}` : "",
    link && expiry
      ? sq
        ? `Lidhja skadon pas ${expiry} minutash.`
        : `This link expires in ${expiry} minutes.`
      : "",
    securityNote ? `\n${securityNote}` : "",
    "",
    "-----------------------------",
    footer,
    `© ${new Date().getFullYear()} Green Card Kosova`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
