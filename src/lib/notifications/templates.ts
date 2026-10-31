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

  const configuredBase = process.env.EMAIL_ASSET_BASE_URL || "";
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const appBase =
    publicAppUrl && !publicAppUrl.includes("localhost") && !publicAppUrl.includes("YOUR-DOMAIN")
      ? publicAppUrl
      : "";
  const assetBase = (
    configuredBase ||
    appBase ||
    "https://raw.githubusercontent.com/lorikjashari/greencard/main/public"
  ).replace(/\/+$/, "");
  const logoUrl = `${assetBase}/brand/email-logo.png`;
  const markUrl = `${assetBase}/brand/email-mark.png`;

  const detail = (label: string, value: string) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
      <tr>
        <td style="border-left:2px solid #C5A56A;padding:2px 0 2px 14px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#9A7A45;">${escapeHtml(label)}</div>
          <div style="margin-top:5px;font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:bold;letter-spacing:1.2px;color:#143229;">${escapeHtml(value)}</div>
        </td>
      </tr>
    </table>`;

  const html = `<!doctype html>
<html lang="${locale}" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light only">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#EFEBE0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.heading)}${reference ? ` · ${escapeHtml(reference)}` : ""}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFEBE0;">
      <tr>
        <td align="center" style="padding:34px 14px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FBF9F3;border:1px solid #DCD5C4;border-top:3px solid #153D32;">
            <tr>
              <td style="padding:26px 36px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" width="196" height="42" alt="Green Card Kosova" style="display:block;width:196px;height:42px;border:0;outline:none;text-decoration:none;">
                    </td>
                    <td align="right" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.6;letter-spacing:2px;text-transform:uppercase;color:#8A9188;">DV Lottery<br>Prishtinë</td>
                  </tr>
                </table>
                <div style="height:1px;background:#E4DECF;margin-top:20px;font-size:0;line-height:0;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 36px 0;">
                <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:#9A7A45;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:12px 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:29px;line-height:1.22;color:#143229;font-weight:normal;letter-spacing:-0.2px;">${escapeHtml(content.heading)}</h1>
                ${content.paragraphs.map((p) => `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3A463F;">${escapeHtml(p)}</p>`).join("")}
                ${reference ? detail(sq ? "Referenca" : "Reference", reference) : ""}
                ${ctx.confirmationNumber ? detail(sq ? "Numri i konfirmimit" : "Confirmation number", ctx.confirmationNumber) : ""}
                ${
                  isLink
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                        <tr>
                          <td align="center" bgcolor="#153D32" style="border-radius:2px;">
                            <a href="${escapeHtml(link!)}" style="display:block;padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1.8px;text-transform:uppercase;color:#F7F3E7;text-decoration:none;text-align:center;">${escapeHtml(content.cta!)}</a>
                          </td>
                        </tr>
                      </table>
                      ${expiry ? `<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.6;color:#9A7A45;">${sq ? `Lidhja skadon pas ${expiry} minutash.` : `This link expires in ${expiry} minutes.`}</p>` : ""}
                      <p style="margin:14px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:1.7;color:#6E7A72;word-break:break-all;">${sq ? "Nëse butoni nuk hapet, kopjo këtë lidhje:" : "If the button does not open, copy this link:"}<br><a href="${escapeHtml(link!)}" style="color:#4A5A51;text-decoration:underline;">${escapeHtml(link!)}</a></p>`
                    : ""
                }
                ${securityNote ? `<p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.7;color:#7A857D;">${escapeHtml(securityNote)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px 32px;">
                <div style="height:1px;background:#E4DECF;font-size:0;line-height:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
                  <tr>
                    <td width="20" style="vertical-align:middle;"><img src="${markUrl}" width="20" height="20" alt="" style="display:block;width:20px;height:20px;border:0;"></td>
                    <td style="vertical-align:middle;padding-left:8px;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#5F6B63;">Green Card Kosova</td>
                    <td align="right" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:1px;color:#9AA39C;">${new Date().getFullYear()}</td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.7;color:#7A857D;">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
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
