import { cn } from "@/lib/cn";
import type { Copy } from "@/messages/get";
import type { ApplicationStatus, PaymentStatus, PhotoStatus } from "@/lib/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "forest";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-ivory text-muted",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  forest: "border-forest-200 bg-forest-50 text-forest-700",
};

const APPLICATION_TONE: Record<ApplicationStatus, Tone> = {
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  needs_information: "warning",
  ready_to_file: "forest",
  filed: "success",
  confirmation_sent: "success",
  selected: "success",
  not_selected: "neutral",
  cancelled: "neutral",
  expired: "neutral",
  rejected: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  created: "neutral",
  pending_cash: "warning",
  pending_card: "warning",
  paid: "success",
  refunded: "info",
  disputed: "danger",
  failed: "danger",
  expired: "neutral",
};

const PHOTO_TONE: Record<PhotoStatus, Tone> = {
  pending: "warning",
  valid: "info",
  invalid: "danger",
  approved: "success",
  rejected: "danger",
};

export function StatusBadge({
  kind,
  value,
  t,
  className,
}: {
  kind: "application" | "payment" | "photo";
  value: ApplicationStatus | PaymentStatus | PhotoStatus;
  t: Copy;
  className?: string;
}) {
  const label =
    kind === "application"
      ? (t.status as Record<string, string>)[value]
      : kind === "payment"
        ? (t.status as Record<string, string>)[value]
        : (t.status as Record<string, string>)[`photo_${value}`];

  const tone =
    kind === "application"
      ? APPLICATION_TONE[value as ApplicationStatus]
      : kind === "payment"
        ? PAYMENT_TONE[value as PaymentStatus]
        : PHOTO_TONE[value as PhotoStatus];

  return (
    <span className={cn("chip", TONES[tone], className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-emerald-600",
          tone === "warning" && "bg-amber-600",
          tone === "danger" && "bg-red-600",
          tone === "info" && "bg-sky-600",
          tone === "forest" && "bg-forest-600",
          tone === "neutral" && "bg-muted/60",
        )}
        aria-hidden="true"
      />
      {label ?? String(value)}
    </span>
  );
}
