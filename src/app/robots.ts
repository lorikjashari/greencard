import type { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const { appUrl } = getPublicConfig();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/sq/account", "/en/account", "/sq/apply", "/en/apply", "/sq/login", "/en/login"],
      },
    ],
    sitemap: `${appUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
