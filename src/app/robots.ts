import type { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const { appUrl } = getPublicConfig();
  const base = appUrl.replace(/\/$/, "");
  const disallow = [
    "/admin",
    "/api",
    "/sq/account",
    "/en/account",
    "/sq/apply",
    "/en/apply",
    "/sq/login",
    "/en/login",
    "/sq/resume",
    "/en/resume",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: new URL(base).host,
  };
}
