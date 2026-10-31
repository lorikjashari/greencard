import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Brand logo. Uses the generated transparent PNG lockup for full size and the
 * square emblem when compact. Inverted variants are cream-on-transparent for
 * dark surfaces.
 */
export function Logo({
  href,
  compact = false,
  inverted = false,
  priority = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const src = compact
    ? inverted
      ? "/brand/mark-inverted.png"
      : "/brand/mark.png"
    : inverted
      ? "/brand/logo-inverted.png"
      : "/brand/logo.png";

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={src}
        alt="Green Card Kosova"
        width={compact ? 306 : 1200}
        height={compact ? 306 : 259}
        priority={priority}
        className={compact ? "h-[30px] w-[30px]" : "h-[30px] w-auto sm:h-[34px]"}
      />
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
