import assert from "node:assert/strict";
import test from "node:test";

import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  softwareApplicationJsonLd,
} from "../lib/seo/json-ld";
import {createPersianPageMetadata} from "../lib/seo/metadata";

test("Persian page metadata includes canonical, language, Open Graph, and Twitter contracts", () => {
  const metadata = createPersianPageMetadata({
    path: "/fa/app/calorie-counter-iphone",
    title: "کالری شمار آیفون | ثبت غذا و محاسبه کالری با جیرو",
    description: "کالری شمار فارسی برای ثبت غذا و ماکروها روی آیفون.",
    ogTitle: "کالری شمار آیفون | جیرو",
    ogDescription: "ثبت غذا و کالری روی آیفون با رابط فارسی.",
    imageAlt: "کالری شمار آیفون جیرو",
  });

  const alternates = metadata.alternates as {
    canonical: URL;
    languages: Record<string, URL>;
  };
  const openGraph = metadata.openGraph as {
    title: string;
    description: string;
    url: URL;
    locale: string;
    images: Array<{alt: string}>;
  };
  const twitter = metadata.twitter as {
    card: string;
    title: string;
    description: string;
    images: string[];
  };

  assert.equal(metadata.title, "کالری شمار آیفون | ثبت غذا و محاسبه کالری با جیرو");
  assert.equal(metadata.description, "کالری شمار فارسی برای ثبت غذا و ماکروها روی آیفون.");
  assert.equal(alternates.canonical.toString(), "https://gyrohealth.ir/fa/app/calorie-counter-iphone");
  assert.equal(alternates.languages["fa-IR"].toString(), alternates.canonical.toString());
  assert.equal(openGraph.title, "کالری شمار آیفون | جیرو");
  assert.equal(openGraph.description, "ثبت غذا و کالری روی آیفون با رابط فارسی.");
  assert.equal(openGraph.url.toString(), alternates.canonical.toString());
  assert.equal(openGraph.locale, "fa_IR");
  assert.equal(openGraph.images[0]?.alt, "کالری شمار آیفون جیرو");
  assert.equal(twitter.card, "summary_large_image");
  assert.equal(twitter.title, openGraph.title);
  assert.equal(twitter.description, openGraph.description);
  assert.deepEqual(twitter.images, ["/twitter-image"]);
});

test("commercial-page JSON-LD graph contains complete application, breadcrumb, and FAQ nodes", () => {
  const graph = jsonLdGraph([
    softwareApplicationJsonLd({
      name: "جیرو",
      description: "کالری شمار و دفتر تغذیه فارسی برای آیفون و وب.",
      path: "/fa/app/calorie-counter-iphone",
      operatingSystem: "iOS, Web",
    }),
    breadcrumbJsonLd([
      {name: "جیرو", path: "/"},
      {name: "کالری شمار آیفون", path: "/fa/app/calorie-counter-iphone"},
    ]),
    faqPageJsonLd([
      {
        question: "آیا جیرو اپ آیفون دارد؟",
        answer: "جیرو در حال حاضر روی آیفون به صورت وب اپ فارسی قابل استفاده است.",
      },
    ]),
  ]) as Record<string, unknown>;

  assert.equal(graph["@context"], "https://schema.org");
  const nodes = graph["@graph"] as Array<Record<string, unknown>>;
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(graph)));

  const application = nodes.find((node) => node["@type"] === "SoftwareApplication");
  assert.ok(application);
  assert.equal(application.name, "جیرو");
  assert.equal(application.applicationCategory, "HealthApplication");
  assert.equal(application.operatingSystem, "iOS, Web");
  assert.equal(application.inLanguage, "fa-IR");
  assert.equal(application.url, "https://gyrohealth.ir/fa/app/calorie-counter-iphone");
  assert.deepEqual(application.offers, {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IRR",
  });

  const breadcrumbs = nodes.find((node) => node["@type"] === "BreadcrumbList");
  assert.ok(breadcrumbs);
  assert.deepEqual(breadcrumbs.itemListElement, [
    {
      "@type": "ListItem",
      position: 1,
      name: "جیرو",
      item: "https://gyrohealth.ir/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "کالری شمار آیفون",
      item: "https://gyrohealth.ir/fa/app/calorie-counter-iphone",
    },
  ]);

  const faq = nodes.find((node) => node["@type"] === "FAQPage");
  assert.ok(faq);
  assert.deepEqual(faq.mainEntity, [
    {
      "@type": "Question",
      name: "آیا جیرو اپ آیفون دارد؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "جیرو در حال حاضر روی آیفون به صورت وب اپ فارسی قابل استفاده است.",
      },
    },
  ]);
});

test("guide article JSON-LD uses an absolute canonical URL and an ISO modification date", () => {
  const article = articleJsonLd({
    headline: "چطور کالری بشماریم؟",
    description: "راهنمای عملی شروع ثبت غذای روزانه.",
    path: "/fa/guides/how-to-count-calories",
    dateModified: "2026-07-21",
  });

  assert.deepEqual(article, {
    "@type": "Article",
    headline: "چطور کالری بشماریم؟",
    description: "راهنمای عملی شروع ثبت غذای روزانه.",
    inLanguage: "fa-IR",
    url: "https://gyrohealth.ir/fa/guides/how-to-count-calories",
    dateModified: "2026-07-21",
  });
});
