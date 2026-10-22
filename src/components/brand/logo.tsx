import Link from "next/link";

export function Logo({
  href,
  compact = false,
  inverted = false,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] ${
          inverted ? "bg-white/10 text-white" : "bg-forest text-white"
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M16.5 7.5A5.6 5.6 0 1 0 17.4 14H12v-2.6h5.7" strokeLinecap="round" />
          <circle cx="18.2" cy="6" r="1.2" fill="#C5A56A" stroke="none" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`text-[15px] font-semibold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
            Green Card Kosova
          </span>
          <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.14em] ${inverted ? "text-white/60" : "text-muted"}`}>
            DV Application Service
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-sm" aria-label="Green Card Kosova">
        {content}
      </Link>
    );
  }
  return content;
}
