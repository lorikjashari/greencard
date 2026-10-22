import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileCheck2, ImageIcon } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { getApplication } from "@/lib/repo/applications";
import { filingBlockers } from "@/lib/admin/filing-readiness";
import { getOrderForApplication } from "@/lib/repo/orders";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import { countryName } from "@/lib/countries";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { CopyButton } from "@/components/ui/copy-button";
import { AdminPageHeader, SectionCard } from "@/components/admin/ui";
import type { PersonData } from "@/lib/types";

export const metadata: Metadata = { title: "Filing workspace" };
export const dynamic = "force-dynamic";

function personLines(
  person: PersonData,
  labels: Record<string, string>,
  educationLabels: Record<string, string>,
  locale: "sq" | "en",
  includeEligibility = false,
): Array<[string, string]> {
  return ([
    [labels.firstName, person.firstName],
    [labels.middleName, person.middleName],
    [labels.lastName, person.lastName],
    [labels.dateOfBirth, person.dateOfBirth],
    [labels.gender, person.gender === "male" ? labels.male : person.gender === "female" ? labels.female : ""],
    [labels.birthCity, person.birthCity],
    [labels.birthCountry, countryName(person.birthCountry, locale)],
    [
      labels.eligibilityCountry,
      includeEligibility
        ? countryName(person.eligibilityCountry || person.birthCountry, locale)
        : person.eligibilityCountry
          ? countryName(person.eligibilityCountry, locale)
          : "",
    ],
    [labels.nationality, person.nationality ? countryName(person.nationality, locale) : ""],
    [labels.education, person.education ? educationLabels[person.education] ?? person.education : ""],
  ] as Array<[string, string]>).filter(([, value]) => value.trim().length > 0);
}

function groupText(lines: Array<[string, string]>): string {
  return lines.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function Field({
  label,
  value,
  copyLabel,
  copiedLabel,
  failedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  failedLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
      <dt className="min-w-0 text-[12.5px] text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 text-right text-[13px] font-medium text-ink">
        <span className="min-w-0 break-words">{value || "—"}</span>
        {value && (
          <CopyButton
            value={value}
            label={copyLabel}
            copiedLabel={copiedLabel}
            failedLabel={failedLabel}
            compact
          />
        )}
      </dd>
    </div>
  );
}

export default async function FilingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage("filing.file");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const dvYear = await getActiveDvYear();
  const application = await getApplication(id);
  if (!application) notFound();
  const order = await getOrderForApplication(application.id);

  const copyLabel = t.common.copy;
  const copiedLabel = t.common.copied;
  const failedLabel = t.common.copyFailed;
  const labels = {
    firstName: t.apply.firstName,
    middleName: t.apply.middleName,
    lastName: t.apply.lastName,
    dateOfBirth: t.apply.dob,
    gender: t.apply.gender,
    male: t.apply.male,
    female: t.apply.female,
    birthCity: t.apply.birthCity,
    birthCountry: t.apply.birthCountry,
    eligibilityCountry: t.apply.eligibilityCountry,
    nationality: t.apply.nationality,
    education: t.apply.education,
  };

  const educationLabels = {
    none: t.apply.educationNone,
    high_school: t.apply.educationHighSchool,
    university: t.apply.educationUniversity,
    masters: t.apply.educationMasters,
    doctorate: t.apply.educationDoctorate,
  };

  const applicant = personLines(application.applicant, labels, educationLabels, locale, true);
  const spouse =
    application.household.spouseIncluded && application.spouse
      ? personLines(application.spouse, labels, educationLabels, locale)
      : [];
  const children = application.children.map((child) => personLines(child, labels, educationLabels, locale));
  const contact: Array<[string, string]> = ([
    [t.common.email, application.contact.email],
    [t.common.phone, application.contact.phone],
    [t.apply.address1, application.contact.addressLine1],
    [t.apply.address2, application.contact.addressLine2],
    [t.apply.city, application.contact.city],
    [t.apply.postalCode, application.contact.postalCode],
    [t.apply.country, countryName(application.contact.country, locale)],
  ] as Array<[string, string]>).filter(([, value]) => value.trim().length > 0);

  const blockerMessages: Record<string, string> = {
    payment: tx("Pagesa nuk është konfirmuar.", "Payment is not confirmed."),
    amount_mismatch: tx(
      "Shuma e arkëtuar nuk përputhet me porosinë dhe nuk është shqyrtuar. Kontrollo rakordimin e pagesave.",
      "The received amount does not match the order and has not been reviewed. Check payment reconciliation.",
    ),
    data: tx("Mungojnë të dhëna të detyrueshme.", "Some required data is missing."),
    photo: tx(
      "Fotografitë e kërkuara duhet të jenë të aprovuara nga stafi.",
      "All required photos must be approved by staff.",
    ),
  };
  const blockers: string[] = filingBlockers(application, order).map(
    (code) => blockerMessages[code] ?? code,
  );
  if (!["ready_to_file", "filed", "confirmation_sent"].includes(application.status)) {
    blockers.unshift(
      tx(
        `Statusi i rastit është ${t.status[application.status]}; dorëzimi nuk lejohet ende.`,
        `Case status is ${t.status[application.status]}; filing is not allowed yet.`,
      ),
    );
  }
  const duplicateWarning =
    application.duplicate.level !== "none"
      ? tx(
          "U gjet një dyshim për dublikatë; shqyrtoje para dorëzimit. Nuk është bllokues automatik.",
          "A possible duplicate was detected; review it before filing. It is not an automatic blocker.",
        )
      : null;

  const maritalLabel = application.household.maritalStatus
    ? {
        single: t.apply.maritalSingle,
        married: t.apply.maritalMarried,
        divorced: t.apply.maritalDivorced,
        widowed: t.apply.maritalWidowed,
        separated: t.apply.maritalSeparated,
      }[application.household.maritalStatus]
    : "";

  return (
    <div>
      <AdminPageHeader
        title={tx(`Hapësira e dorëzimit · ${application.ref}`, `Filing workspace · ${application.ref}`)}
        description={`${application.applicant.firstName} ${application.applicant.lastName} · DV ${application.dvYear} · ${formatCurrency(application.amountCents, locale)}`}
        actions={
          <Link href={`/admin/applications/${application.id}`} className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {tx("Aplikimi", "Application")}
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge kind="application" value={application.status} t={t} />
        <StatusBadge kind="payment" value={application.paymentStatus} t={t} />
        <span className="chip border-line bg-white text-muted">
          {tx("Dorëzuar", "Submitted")} {formatDate(application.submittedAt, locale)}
        </span>
        {order?.amountMismatch && order.mismatchReviewedAt && (
          <span className="chip border-emerald-200 bg-emerald-50 text-emerald-800">
            {tx("Mospërputhja u shqyrtua", "Mismatch reviewed")}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {blockers.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[13px] leading-6 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {tx(
                "Gati për dorëzim manual. Verifiko çdo vlerë në formularin zyrtar përpara se ta dorëzosh.",
                "Ready for manual filing. Verify every value against the official form before submitting.",
              )}
            </span>
          </div>
        ) : (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[13px] leading-6 text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {tx("Zgjidhi këto bllokues para se të regjistrojë një dorëzim", "Resolve these blockers before recording a filing")}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        )}

        {duplicateWarning && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-white p-3 text-[13px] leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {duplicateWarning}
          </div>
        )}

        <div className="rounded-md border border-line bg-white p-3.5 text-[13px] leading-6 text-ink/80">
          <p className="font-semibold text-ink">{tx("Si të përdoret kjo hapësirë", "How to use this workspace")}</p>
          <p className="mt-1">
            {tx(
              "Fushat më poshtë ndjekin rendin e formularit zyrtar të DV-së. Kopjo një vlerë ose një grup, pastaj verifikoje në faqen zyrtare. Shfaqen vetëm të dhënat e dhëna nga klienti. Formulari zyrtar mund të kërkojë fusha që nuk mblidhen këtu; mos shpik asnjë përgjigje.",
              "The fields below follow the order used by the official DV entry form. Copy one value or a whole group, then verify it on the official site. Only data supplied by the client is shown. The official form may request fields that are not collected here; never invent an answer.",
            )}
          </p>
          <p className="mt-2">
            {tx("Udhëzimet zyrtare:", "Official instructions:")}{" "}
            <a
              href={dvYear.instructionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-semibold text-forest underline underline-offset-2"
            >
              dvprogram.state.gov
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>

        <SectionCard
          title={t.apply.applicantTitle}
          description={tx("Kopjo grupin e aplikantit ose vlerat individuale.", "Copy the applicant group or individual values.")}
          action={
            <CopyButton
              value={groupText([...applicant, ...contact])}
              label={tx("Kopjo grupin e aplikantit", "Copy applicant group")}
              copiedLabel={tx("Grupi u kopjua", "Applicant group copied")}
              failedLabel={failedLabel}
            />
          }
        >
          <dl>
            {applicant.map(([label, value]) => (
              <Field key={label} label={label} value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
            ))}
          </dl>
        </SectionCard>

        <SectionCard
          title={t.apply.reviewContact}
          action={
            <CopyButton
              value={groupText(contact)}
              label={tx("Kopjo kontaktin", "Copy contact group")}
              copiedLabel={tx("Kontakti u kopjua", "Contact group copied")}
              failedLabel={failedLabel}
            />
          }
        >
          <dl>
            {contact.map(([label, value]) => (
              <Field key={label} label={label} value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
            ))}
          </dl>
        </SectionCard>

        {application.household.maritalStatus && (
          <SectionCard title={tx("Statusi martesor dhe bashkëshorti/ja", "Marital status and spouse")}>
            <dl>
              <Field label={t.apply.maritalLabel} value={maritalLabel} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
              <Field
                label={t.apply.spouseIncludedLabel}
                value={application.household.spouseIncluded ? t.common.yes : t.common.no}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                failedLabel={failedLabel}
              />
              {!application.household.spouseIncluded && application.household.spouseExclusionReason && (
                <Field
                  label={t.apply.spouseExcludedLabel}
                  value={application.household.spouseExclusionReason}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                  failedLabel={failedLabel}
                />
              )}
            </dl>
            {spouse.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink">
                    {tx("Bashkëshorti/ja", "Spouse")}
                  </h3>
                  <CopyButton
                    value={groupText(spouse)}
                    label={tx("Kopjo bashkëshortin/en", "Copy spouse group")}
                    copiedLabel={tx("Bashkëshorti/ja u kopjua", "Spouse group copied")}
                    failedLabel={failedLabel}
                  />
                </div>
                <dl>
                  {spouse.map(([label, value]) => (
                    <Field key={label} label={label} value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
                  ))}
                </dl>
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard
          title={`${t.apply.childrenTitle} (${children.length})`}
          description={tx(
            "Fëmijët e pamartuar nën 21 vjeç duhet të listohen edhe nëse nuk do të emigrojnë.",
            "Unmarried children under 21 must be listed even if they will not immigrate.",
          )}
        >
          {children.length === 0 ? (
            <p className="text-[13px] text-muted">{t.apply.reviewNoChildren}</p>
          ) : (
            <div className="space-y-4">
              {application.children.map((child, index) => (
                <div key={child.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-ink">
                      {t.apply.child} {index + 1}: {child.firstName} {child.lastName}
                    </h3>
                    <CopyButton
                      value={groupText(children[index])}
                      label={tx("Kopjo fëmijën", "Copy child group")}
                      copiedLabel={tx("Fëmija u kopjua", "Child group copied")}
                      failedLabel={failedLabel}
                    />
                  </div>
                  <dl>
                    {children[index].map(([label, value]) => (
                      <Field key={label} label={label} value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
                    ))}
                    <Field label={tx("I martuar", "Married")} value={child.married ? t.common.yes : t.common.no} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
                    <Field label={tx("Jeton me aplikantin", "Lives with applicant")} value={child.livesWithApplicant ? t.common.yes : t.common.no} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
                    <Field label={tx("Fëmijë i bashkëshortit/es", "Stepchild")} value={child.isStepchild ? t.common.yes : t.common.no} copyLabel={copyLabel} copiedLabel={copiedLabel} failedLabel={failedLabel} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t.apply.photosTitle}
          description={tx("Hap secilën foto dhe ngarko skedarin origjinal në faqen zyrtare.", "Open each photo and upload the original file to the official site.")}
        >
          {application.photos.length === 0 ? (
            <p className="text-[13px] text-muted">{tx("Nuk ka foto të bashkangjitura.", "No photos are attached.")}</p>
          ) : (
            <ul className="space-y-2">
              {application.photos.map((photo) => (
                <li key={photo.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-ivory/50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                      <ImageIcon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                      {photo.memberName}
                    </p>
                    <p className="text-2xs text-muted">
                      {photo.originalName} · {photo.width}×{photo.height} px · {(photo.bytes / 1024).toFixed(0)} KB ·{" "}
                      {photo.status}
                    </p>
                  </div>
                  <a
                    href={`/api/files/${photo.storageKey}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn-secondary btn-sm"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {tx("Hap foton", "Open photo")}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <p className="text-2xs leading-5 text-muted">
          {tx(
            "Dorëzimi regjistrohet vetëm nga faqja e aplikimit pasi rasti të jetë gati dhe pagesa të konfirmohet. Kjo faqe nuk dorëzon asgjë tek qeveria dhe nuk ndryshon statusin e rastit.",
            "Filing is recorded only from the application page after the case is ready and payment is confirmed. This page does not submit anything to the government and does not change the case status.",
          )}
        </p>
      </div>
    </div>
  );
}
