import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Masthead used by every secondary page. It keeps one rhythm across the site:
 * a mono eyebrow tied to a clay rule, a serif display line, an optional lede and
 * a right-hand slot for facts, stamps or primary actions.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  size = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  aside?: React.ReactNode;
  size?: "default" | "large";
  className?: string;
}) {
  return (
    <header className={cn("border-b border-line bg-ivory/40", className)}>
      <div className="container-page py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-[46rem]">
            {eyebrow && (
              <div className="flex items-center gap-3">
                <span className="h-px w-7 bg-clay" aria-hidden="true" />
                <p className="eyebrow">{eyebrow}</p>
              </div>
            )}
            <h1
              className={cn(
                "display mt-4 text-balance",
                size === "large"
                  ? "text-[clamp(2.2rem,5.2vw,3.5rem)]"
                  : "text-[clamp(1.95rem,4vw,2.85rem)]",
              )}
            >
              {title}
            </h1>
            {lede && <p className="lede mt-4 max-w-[38rem] text-[15.5px]">{lede}</p>}
          </div>
          {aside && <div className="lg:pb-1">{aside}</div>}
        </div>
      </div>
    </header>
  );
}

/** Two-column editorial body: a sticky rail on the left, content on the right. */
export function PageBody({
  rail,
  children,
  className,
}: {
  rail?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container-page py-12 md:py-16", className)}>
      <div className={cn("grid gap-10", rail && "lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16")}>
        {rail && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            {rail}
          </div>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/**
 * Disclosure list used on the landing page and the FAQ page. Native
 * `details`/`summary` keeps it keyboard accessible and works without JS.
 */
export function FaqList({
  items,
  openFirst = false,
}: {
  items: Array<{ q: string; a: string }>;
  openFirst?: boolean;
}) {
  return (
    <div className="border-t border-line">
      {items.map((item, index) => (
        <details key={item.q} className="group border-b border-line" open={openFirst && index === 0}>
          <summary className="flex cursor-pointer list-none items-start gap-4 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="mt-1 font-mono text-3xs tabular text-clay-600" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 text-[14.5px] font-medium leading-6 text-ink transition-colors group-hover:text-forest-800">
              {item.q}
            </span>
            <Plus
              className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <p className="mb-5 max-w-xl pl-9 text-[13.5px] leading-6 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
