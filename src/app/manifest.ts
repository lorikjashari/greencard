import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aplikodv — Apliko Green Card USA",
    short_name: "Aplikodv",
    description:
      "Përgatitje, kontroll dhe dorëzim i aplikimit për Lotarinë e Vizave të Diversitetit (DV) në Kosovë.",
    start_url: "/sq",
    scope: "/",
    display: "standalone",
    background_color: "#FBF9F3",
    theme_color: "#153D32",
    lang: "sq",
    dir: "ltr",
    categories: ["business", "services"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Fillo aplikimin", short_name: "Apliko", url: "/sq/apply" },
      { name: "Pyetje të shpeshta", short_name: "FAQ", url: "/sq/faq" },
    ],
  };
}
