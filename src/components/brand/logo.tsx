import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The mark is typographic, not pictorial: a spruce square holding a serif
 * "G", with a clay corner tick that echoes a filing stamp. No icon font,
 * no emoji, no decorative gradients.
 */
export function Logo({
  href,
  compact = false,
  inverted = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid h-[30px] w-[30px] shrink-0 place-items-center",
          inverted ? "bg-paper text-forest-900" : "bg-forest-800 text-paper",
        )}
        aria-hidden="true"
      >
        <span className="font-serif text-[18px] font-normal leading-none -mt-px">G</span>
        <span
          className={cn(
            "absolute -bottom-px -right-px h-1.5 w-1.5",
            inverted ? "bg-clay-300" : "bg-clay",
          )}
        />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate font-serif text-[16px] font-medium leading-none tracking-[-0.01em]",
              inverted ? "text-paper" : "text-forest-900",
            )}
          >
            Green Card Kosova
          </span>
          <span
            className={cn(
              "mt-[5px] font-mono text-[9px] uppercase leading-none",
              inverted ? "text-paper/55" : "text-muted",
            )}
            style={{ letterSpacing: "0.19em" }}
          >
            DV · Prishtinë
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
