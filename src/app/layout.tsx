import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

/**
 * Fonts are self-hosted through @fontsource instead of next/font/google.
 * Builds no longer depend on reaching fonts.googleapis.com, which previously
 * failed the production build in offline/restricted environments.
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Green Card Kosova",
    template: "%s · Green Card Kosova",
  },
  description:
    "Shërbim privat për përgatitjen, kontrollin dhe dorëzimin e aplikimeve për Lotarinë e Vizave të Diversitetit.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Green Card Kosova",
    description:
      "Përgatitje e kujdesshme e aplikimit DV — me proces të qartë dhe mbështetje njerëzore.",
    type: "website",
    locale: "sq_AL",
  },
};

export const viewport: Viewport = {
  themeColor: "#18372E",
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
