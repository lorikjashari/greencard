import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

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
  themeColor: "#153D32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" className={manrope.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-ivory font-sans text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
        >
          Kalo në përmbajtje
        </a>
        {children}
      </body>
    </html>
  );
}
