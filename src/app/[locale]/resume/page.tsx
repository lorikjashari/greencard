import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

/**
 * Drafts resume from the device that created them (the wizard restores the
 * stored draft automatically), so a separate "resume" screen was a second
 * near-identical sign-in page. The URL is kept as a redirect for old links.
 */
export const dynamic = "force-dynamic";

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(isLocale(locale) ? `/${locale}/apply` : "/sq/apply");
}
