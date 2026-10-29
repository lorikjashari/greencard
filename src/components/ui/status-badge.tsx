import { cn } from "@/lib/cn";
import type { Copy } from "@/messages/get";
import type { ApplicationStatus, PaymentStatus, PhotoStatus } from "@/lib/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "forest";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-ivory text-muted",
  success: "border-forest-300 bg-forest-50 text-forest-700",
  warning: "border-warning/40 bg-warning-50 text-warning",
  danger: "border-danger/40 bg-danger-50 text-danger",
  info: "border-info/25 bg-info-50 text-info",
  forest: "border-forest-300 bg-forest-50 text-forest-700",
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
          "h-1.5 w-1.5",
          tone === "success" && "bg-forest-500",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
          tone === "info" && "bg-info",
          tone === "forest" && "bg-forest-600",
          tone === "neutral" && "bg-muted/60",
        )}
        aria-hidden="true"
      />
      {label ?? String(value)}
    </span>
  );
}
