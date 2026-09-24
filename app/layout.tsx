import "./globals.css";
import type {Metadata, Viewport} from "next";
import Script from "next/script";
import {preload} from "react-dom";

import {ToasterLazy} from "@/components/ui/toaster-lazy";
import {OfflineReadOnlyNotice} from "@/components/feedback/offline-read-only-notice";
import {ServiceWorkerRegistration} from "@/components/pwa/service-worker-registration";
import {getDictionary} from "@/lib/i18n/dictionaries";
import {appShellLocale, localeDefinitionFor} from "@/lib/i18n/config";
import {marketingBaseUrl} from "@/lib/seo/metadata";
import {DialogQueueProvider} from "@/components/dialog-queue/dialog-queue-provider";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(appShellLocale);
  const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

  return {
    metadataBase: new URL(marketingBaseUrl),
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    applicationName: dictionary.metadata.applicationName,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: dictionary.metadata.appleTitle
    },
    formatDetection: {
      telephone: false
    },
    icons: {
      icon: [
        {url: "/icons/pwa/icon-192.png", sizes: "192x192", type: "image/png"},
        {url: "/icons/pwa/icon-512.png", sizes: "512x512", type: "image/png"}
      ],
      apple: [
        {url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png"}
      ],
      shortcut: ["/icons/pwa/icon-192.png"]
    },
    verification: {
      ...(googleSiteVerification ? {google: googleSiteVerification} : {}),
      ...(bingSiteVerification
        ? {other: {"msvalidate.01": bingSiteVerification}}
        : {})
    }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d1513"
};

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  const localeDefinition = localeDefinitionFor(appShellLocale);
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  // The arabic subset renders nearly all visible text; preload it so the first
  // paint doesn't wait for CSS parsing to discover the font.
  preload("/fonts/vazirmatn-arabic-wght-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang={localeDefinition.htmlLang} dir={localeDefinition.dir} className="dark">
      <body>
        {umamiSrc && umamiWebsiteId ? (
          <Script
            src={umamiSrc}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
        <ServiceWorkerRegistration>
          <DialogQueueProvider>
            {children}
          </DialogQueueProvider>
          <OfflineReadOnlyNotice />
          <ToasterLazy dir={localeDefinition.dir} />
        </ServiceWorkerRegistration>
      </body>
    </html>
  );
}
