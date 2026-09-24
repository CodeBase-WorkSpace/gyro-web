import type {Metadata} from "next";

export const marketingBaseUrl =
  process.env.NEXT_PUBLIC_MARKETING_BASE_URL ?? "https://gyrohealth.ir";

export const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "";
export const appInstallHref = `${appBaseUrl}/auth/login?install=1`;

export const siteName = "جیرو";

const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
};

export type PersianPageMetadataInput = {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  imageAlt: string;
};

export function absoluteMarketingUrl(path: string) {
  return new URL(path, marketingBaseUrl);
}

export function createPersianPageMetadata({
                                            path,
                                            title,
                                            description,
                                            ogTitle = title,
                                            ogDescription = description,
                                            imageAlt,
                                          }: PersianPageMetadataInput): Metadata {
  const canonicalUrl = absoluteMarketingUrl(path);

  return {
    metadataBase: new URL(marketingBaseUrl),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fa-IR": canonicalUrl,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName,
      locale: "fa_IR",
      type: "website",
      images: [
        {
          ...defaultOgImage,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/twitter-image"],
    },
  };
}
