import type {MetadataRoute} from "next";

import {marketingBaseUrl} from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/auth",
        "/dashboard",
        "/foods",
        "/logout",
        "/profile",
        "/progress",
        "/unauthorized",
      ],
    },
    sitemap: new URL("/sitemap.xml", marketingBaseUrl).toString(),
    host: marketingBaseUrl,
  };
}
