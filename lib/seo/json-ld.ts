import {absoluteMarketingUrl, siteName} from "./metadata";

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdObject = { [key: string]: JsonLdValue };

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export function organizationJsonLd(): JsonLdObject {
  return {
    "@type": "Organization",
    name: siteName,
    url: absoluteMarketingUrl("/").toString(),
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@type": "WebSite",
    name: siteName,
    url: absoluteMarketingUrl("/").toString(),
    inLanguage: "fa-IR",
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteMarketingUrl(item.path).toString(),
    })),
  };
}

export function softwareApplicationJsonLd({
                                            name,
                                            description,
                                            path,
                                            operatingSystem,
                                            applicationCategory = "HealthApplication",
                                          }: {
  name: string;
  description: string;
  path: string;
  operatingSystem: string;
  applicationCategory?: string;
}): JsonLdObject {
  return {
    "@type": "SoftwareApplication",
    name,
    applicationCategory,
    operatingSystem,
    inLanguage: "fa-IR",
    description,
    url: absoluteMarketingUrl(path).toString(),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IRR",
    },
  };
}

export function faqPageJsonLd(items: FaqItem[]): JsonLdObject {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function articleJsonLd({
                                headline,
                                description,
                                path,
                                dateModified,
                              }: {
  headline: string;
  description: string;
  path: string;
  dateModified: string;
}): JsonLdObject {
  return {
    "@type": "Article",
    headline,
    description,
    inLanguage: "fa-IR",
    url: absoluteMarketingUrl(path).toString(),
    dateModified,
  };
}

export function recipeJsonLd(input: JsonLdObject): JsonLdObject {
  return {
    "@type": "Recipe",
    inLanguage: "fa-IR",
    ...input,
  };
}

export function jsonLdGraph(items: JsonLdObject[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": items,
  };
}
