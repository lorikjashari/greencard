import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/jetbrains-mono";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  ogImage,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

/**
 * Fonts are self-hosted through @fontsource instead of next/font/google.
 * Builds no longer depend on reaching fonts.googleapis.com, which previously
 * failed the production build in offline/restricted environments.
 */

const homeTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: homeTitle,
  description: SITE_DESCRIPTION.sq,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: siteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  keywords: SITE_KEYWORDS.sq,
  alternates: {
    canonical: "/sq",
    languages: { sq: "/sq", en: "/en", "x-default": "/sq" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: homeTitle,
    description: SITE_DESCRIPTION.sq,
    url: "/sq",
    locale: "sq_AL",
    alternateLocale: ["en_GB"],
    images: [
      {
        url: ogImage("sq"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: SITE_DESCRIPTION.sq,
    images: [ogImage("sq")],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
};

export const viewport: Viewport = {
  themeColor: "#153D32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <body className="min-h-dvh bg-ivory font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Kalo në përmbajtje / Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
