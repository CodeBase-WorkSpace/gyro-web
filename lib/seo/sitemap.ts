import type {MetadataRoute} from "next";

import {publicFoods} from "./foods";

const siteUrl = "https://gyrohealth.ir";
const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

export type PublicSitemapPage = {
  path: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  type: "landing" | "product" | "tool" | "guide" | "food" | "legal" | "support";
};

export const publicSitemapPages: PublicSitemapPage[] = [
  {
    path: "/fa",
    lastModified: "2026-07-04",
    changeFrequency: "weekly",
    priority: 1,
    type: "landing",
  },
  {
    path: "/fa/app/calorie-counter-iphone",
    lastModified: "2026-07-04",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "product",
  },
  {
    path: "/fa/app",
    lastModified: "2026-07-07",
    changeFrequency: "weekly",
    priority: 0.9,
    type: "product",
  },
  {
    path: "/fa/app/calorie-counter",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "product",
  },
  {
    path: "/fa/app/persian-calorie-counter",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "product",
  },
  {
    path: "/fa/app/food-diary",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "product",
  },
  {
    path: "/fa/app/macro-tracker",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "product",
  },
  {
    path: "/fa/tools",
    lastModified: "2026-07-12",
    changeFrequency: "weekly",
    priority: 0.9,
    type: "tool",
  },
  {
    path: "/fa/tools/calorie-calculator",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "tool",
  },
  {
    path: "/fa/tools/macro-calculator",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "tool",
  },
  {
    path: "/fa/tools/bmr-calculator",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "tool",
  },
  {
    path: "/fa/tools/tdee-calculator",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "tool",
  },
  {
    path: "/fa/guides",
    lastModified: "2026-07-12",
    changeFrequency: "weekly",
    priority: 0.9,
    type: "guide",
  },
  {
    path: "/fa/guides/calorie-deficit",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "guide",
  },
  {
    path: "/fa/guides/what-is-bmr",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "guide",
  },
  {
    path: "/fa/guides/what-are-macros",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "guide",
  },
  {
    path: "/fa/guides/how-to-count-calories",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "guide",
  },
  {
    path: "/fa/guides/track-persian-foods",
    lastModified: "2026-07-12",
    changeFrequency: "monthly",
    priority: 0.8,
    type: "guide",
  },
  {
    path: "/fa/foods",
    lastModified: "2026-07-21",
    changeFrequency: "weekly",
    priority: 0.9,
    type: "food",
  },
  ...publicFoods.map(
    (food): PublicSitemapPage => ({
      path: `/fa/foods/${food.slug}`,
      lastModified: food.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
      type: "food",
    }),
  ),
  {
    path: "/contact",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.5,
    type: "support",
  },
  {
    path: "/privacy",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.4,
    type: "legal",
  },
  {
    path: "/terms",
    lastModified: "2026-07-07",
    changeFrequency: "monthly",
    priority: 0.4,
    type: "legal",
  },
];

export function publicSitemapXml(pages: PublicSitemapPage[] = publicSitemapPages) {
  const urls = pages.map((page) => {
    const url = new URL(page.path, siteUrl).toString();

    return [
      "<url>",
      `<loc>${escapeXml(url)}</loc>`,
      `<lastmod>${escapeXml(page.lastModified)}</lastmod>`,
      `<changefreq>${page.changeFrequency}</changefreq>`,
      `<priority>${page.priority}</priority>`,
      "</url>",
    ].join("");
  });

  return [
    xmlHeader,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemapPages.map((page) => ({
    url: new URL(page.path, siteUrl).toString(),
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
