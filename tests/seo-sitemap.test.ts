import assert from "node:assert/strict";
import test from "node:test";

import {publicFoods} from "../lib/seo/foods";
import {publicSitemapPages, publicSitemapXml} from "../lib/seo/sitemap";

test("public sitemap renders valid XML instead of plaintext URL rows", () => {
  const xml = publicSitemapXml([
    {
      path: "/fa",
      lastModified: "2026-07-04",
      changeFrequency: "weekly",
      priority: 1,
      type: "landing",
    },
  ]);

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa<\/loc>/);
  assert.match(xml, /<lastmod>2026-07-04<\/lastmod>/);
  assert.match(xml, /<changefreq>weekly<\/changefreq>/);
  assert.match(xml, /<priority>1<\/priority>/);
});

test("public sitemap includes contact and legal pages", () => {
  const xml = publicSitemapXml();

  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/contact<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/privacy<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/terms<\/loc>/);
});

test("public sitemap includes the SEO tool pages", () => {
  const xml = publicSitemapXml();

  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/tools<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/tools\/calorie-calculator<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/tools\/macro-calculator<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/tools\/bmr-calculator<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/tools\/tdee-calculator<\/loc>/);
});

test("public sitemap includes the SEO guide pages", () => {
  const xml = publicSitemapXml();

  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides\/calorie-deficit<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides\/what-is-bmr<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides\/what-are-macros<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides\/how-to-count-calories<\/loc>/);
  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/guides\/track-persian-foods<\/loc>/);
});

test("public sitemap includes the food hub and every approved food page", () => {
  const xml = publicSitemapXml();

  assert.match(xml, /<loc>https:\/\/gyrohealth\.ir\/fa\/foods<\/loc>/);
  for (const slug of publicFoods.map((food) => food.slug)) {
    assert.match(xml, new RegExp(`<loc>https://gyrohealth\\.ir/fa/foods/${slug}</loc>`));
  }
});

test("public sitemap paths are unique and exclude authenticated application routes", () => {
  const paths = publicSitemapPages.map((page) => page.path);

  assert.equal(new Set(paths).size, paths.length);
  for (const privatePrefix of ["/admin", "/api", "/auth", "/dashboard", "/profile", "/progress"]) {
    assert.equal(paths.some((path) => path === privatePrefix || path.startsWith(`${privatePrefix}/`)), false);
  }
});
