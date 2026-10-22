import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectToLatestApplication } from "@/lib/account/redirect";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Application", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountApplicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await redirectToLatestApplication(locale, "application");
}
