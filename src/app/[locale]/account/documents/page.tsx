import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectToLatestApplication } from "@/lib/account/redirect";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Documents", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountDocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await redirectToLatestApplication(locale, "documents");
}
