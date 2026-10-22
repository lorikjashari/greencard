import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl tracking-[-0.01em] text-forest-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-[13px] leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const NOTICES: Record<string, { sq: string; en: string }> = {
  status: { sq: "Statusi u përditësua.", en: "Status updated." },
  assigned: { sq: "Caktimi u ruajt.", en: "Assignment saved." },
  note: { sq: "Shënimi u shtua.", en: "Note added." },
  photo_approved: { sq: "Fotografia u aprovua.", en: "Photo approved." },
  photo_rejected: { sq: "Fotografia u refuzua; njoftimi për klientin u regjistrua.", en: "Photo rejected; the client notification was recorded." },
  payment: { sq: "Pagesa në dorë u regjistrua.", en: "Cash payment recorded." },
  payment_mismatch: { sq: "Pagesa u regjistrua me mospërputhje shume.", en: "Payment recorded with an amount mismatch." },
  payment_mismatch_reviewed: { sq: "Mospërputhja e pagesës u shqyrtua dhe u dokumentua.", en: "The payment mismatch was reviewed and documented." },
  refund: { sq: "Rimbursimi u regjistrua.", en: "Refund recorded." },
  filed: { sq: "Dorëzimi u regjistrua.", en: "Filing recorded." },
  confirmation: { sq: "Njoftimi i konfirmimit u dërgua.", en: "Confirmation email sent." },
  confirmation_outbox: {
    sq: "Email-i nuk është konfiguruar; njoftimi u ruajt në outbox dhe statusi nuk u shënua si i dërguar.",
    en: "Email is not configured; the notification is in the outbox and the status was not marked as sent.",
  },
  edit_request: { sq: "Kërkesa për ndryshim u përditësua.", en: "Edit request updated." },
  data_request: { sq: "Kërkesa për të dhëna u përditësua.", en: "Data request updated." },
  saved: { sq: "Ndryshimet u ruajtën.", en: "Changes saved." },
  activated: { sq: "Viti DV u aktivizua.", en: "DV year activated." },
  member: { sq: "Anëtari i ekipit u ruajt.", en: "Team member saved." },
  retry: { sq: "Tentativa e dërgimit u regjistrua.", en: "Retry attempt recorded." },
  export: { sq: "Eksporti u përgatit.", en: "Export prepared." },
};

const ERRORS: Record<string, { sq: string; en: string }> = {
  forbidden: { sq: "Nuk ke leje për këtë veprim.", en: "You do not have permission for this action." },
  not_found: { sq: "Regjistrimi nuk u gjet.", en: "Record not found." },
  transition: { sq: "Tranzicioni nuk lejohet.", en: "That transition is not allowed." },
  reason_required: { sq: "Shkruaj një arsye (të paktën 5 karaktere).", en: "Enter a reason (at least 5 characters)." },
  use_filing: {
    sq: "Dorëzimi regjistrohet vetëm nga Qendra e dorëzimit, me numër konfirmimi.",
    en: "Filing is recorded only from the Filing centre, with a confirmation number.",
  },
  invalid_assignee: { sq: "Përdoruesi nuk është staf aktiv.", en: "That user is not active staff." },
  note_length: { sq: "Shënimi duhet të ketë 3–2000 karaktere.", en: "The note must be 3–2000 characters." },
  photo_note: {
    sq: "Për refuzimin e fotos, shkruaj një arsye (të paktën 3 karaktere).",
    en: "To reject a photo, enter a reason (at least 3 characters).",
  },
  instructions: {
    sq: "Udhëzimet e pagesës duhet të shkruhen në të dy gjuhët (të paktën 20 karaktere).",
    en: "Payment instructions are required in both languages (at least 20 characters).",
  },
  payment_required: {
    sq: "Pagesa duhet të konfirmohet para se rasti të shënohet gati për dorëzim.",
    en: "Payment must be confirmed before the case can be marked ready to file.",
  },
  payment_mismatch_unreviewed: {
    sq: "Mospërputhja e shumës duhet të shqyrtohet dhe dokumentohet para dorëzimit.",
    en: "The amount mismatch must be reviewed and documented before filing.",
  },
  case_incomplete: {
    sq: "Të dhënat ose fotografitë nuk janë të plota dhe të aprovuara. Plotëso verifikimin para dorëzimit.",
    en: "Data or photos are incomplete or not approved. Complete the review before filing.",
  },
  amount: { sq: "Shuma nuk është e vlefshme.", en: "The amount is not valid." },
  date: { sq: "Data nuk është e vlefshme.", en: "The date is not valid." },
  method: { sq: "Metoda e arkëtimit nuk është e vlefshme.", en: "The receipt method is not valid." },
  note_required: {
    sq: "Kur shuma ndryshon, shënimi shpjegues është i detyrueshëm.",
    en: "An explanatory note is required when the amount differs.",
  },
  payment: { sq: "Pagesa nuk mund të regjistrohet.", en: "The payment could not be recorded." },
  refund: { sq: "Rimbursimi nuk mund të regjistrohet.", en: "The refund could not be recorded." },
  refund_provider: {
    sq: "Rimbursimet me kartë kryhen vetëm në panelin e ofruesit; ky ekran regjistron vetëm cash.",
    en: "Card refunds are performed only in the provider dashboard; this screen records cash refunds only.",
  },
  not_ready: { sq: "Rasti nuk është gati për dorëzim.", en: "The case is not ready to file." },
  already_filed: { sq: "Ky rast ka tashmë një dorëzim të regjistruar.", en: "This case already has a filing." },
  confirmation: { sq: "Numri i konfirmimit është shumë i shkurtër.", en: "The confirmation number is too short." },
  no_filing: { sq: "Duhet regjistruar dorëzimi para njoftimit.", en: "Record the filing before notifying." },
  year: { sq: "Viti DV nuk është i vlefshëm.", en: "The DV year is not valid." },
  dates: { sq: "Datat e hapjes/mbylljes nuk janë të vlefshme.", en: "The opening/closing dates are not valid." },
  url: { sq: "Lidhja duhet të jetë https://.", en: "The URL must start with https://." },
  photo_rules: { sq: "Versioni i rregullave të fotos mungon.", en: "The photo rules version is missing." },
  email: { sq: "Email i pavlefshëm.", en: "Invalid email address." },
  role: { sq: "Roli nuk është i vlefshëm.", en: "Invalid role." },
  self: { sq: "Nuk mund të ndryshosh rolin ose të çaktivizosh veten.", en: "You cannot change your own role or deactivate yourself." },
  last_admin: { sq: "Duhet të mbetet të paktën një administrator aktiv.", en: "At least one active administrator must remain." },
  prices: { sq: "Çmimet duhet të jenë pozitive.", en: "Prices must be positive." },
  rules_version: { sq: "Versioni i rregullave mungon.", en: "The pricing rules version is missing." },
  deadline: { sq: "Afati duhet të jetë 1–60 ditë.", en: "The deadline must be 1–60 days." },
  fee: { sq: "Tarifa pas përzgjedhjes duhet të jetë pozitive kur aktivizohet.", en: "The post-selection fee must be positive when enabled." },
  email_not_configured: {
    sq: "Email-i nuk është konfiguruar. Asgjë nuk u dërgua.",
    en: "Email is not configured. Nothing was sent.",
  },
  email_failed: {
    sq: "Email-i nuk u pranua nga ofruesi. Shiko outbox-in dhe provo përsëri; statusi nuk u shënua si i dërguar.",
    en: "The email was not accepted by the provider. Check the outbox and retry; the status was not marked as sent.",
  },
};

export function AdminNotice({
  locale,
  notice,
  error,
}: {
  locale: Locale;
  notice?: string;
  error?: string;
}) {
  const info = notice ? NOTICES[notice] : null;
  const problem = error ? ERRORS[error] ?? { sq: "Veprimi dështoi.", en: "The action failed." } : null;

  if (!info && !problem) return null;

  return (
    <div className="mt-4 space-y-2">
      {problem && (
        <p
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-[13px] leading-5 text-red-900"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {problem[locale]}
        </p>
      )}
      {info && (
        <p
          className="flex items-start gap-2 rounded-md border border-forest-200 bg-forest-50 p-3 text-[13px] leading-5 text-forest-800"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {info[locale]}
        </p>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-lg border bg-white p-4 transition-colors",
        tone === "warning" && "border-amber-200",
        tone === "danger" && "border-red-200",
        tone === "success" && "border-emerald-200",
        tone === "default" && "border-line",
        href && "hover:border-forest-300",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 font-serif text-2xl text-forest-900">{value}</p>
      {detail && <p className="mt-1 text-2xs leading-5 text-muted">{detail}</p>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-white", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-2xs leading-5 text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminEmpty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-10 text-[13px] text-muted">
      <Info className="h-4 w-4" aria-hidden="true" />
      {text}
    </div>
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}
