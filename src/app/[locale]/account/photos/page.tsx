import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectToLatestApplication } from "@/lib/account/redirect";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Photos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await redirectToLatestApplication(locale, "photos");
}
