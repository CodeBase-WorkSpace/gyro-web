# Rebranding an independent fork

The public source includes Gyro branding so contributors can build and test the original app. The owner does not
permit an independent fork to use the same logo as its product identity. Before distributing or hosting your own
version, replace the official marks and check the resulting build. The [trademark notice](../TRADEMARKS.md) describes
the project name boundary, and [the brand-asset notice](../BRAND_ASSETS.md) specifies the limited copyright permission
for cloning and testing the original logo files.

## Replace the artwork

- Replace the source images in `brand-src/` and the rendered images in `public/brand/` with your own artwork. The UI
  refers to specific `gyro-symbol-*.png` paths; keeping those filenames while changing their contents avoids broken
  images until you update the references.
- Replace `public/icons/pwa/` and `public/apple-touch-icon.png`. The default source for
  `pnpm run icons:pwa` is `brand-src/11-luxury-obsidian.png`. That script uses macOS `sips`, so other platforms should
  supply equivalent PNG files or change the generation script.
- Check rendered social images in `app/opengraph-image.tsx` and `app/twitter-image.tsx` for the old identity.

## Replace names and destinations

- Change the app name and icons in `app/manifest.ts` and `app/layout.tsx`.
- Replace the official domain defaults in `lib/seo/metadata.ts`, `lib/seo/sitemap.ts`, and any social-image text.
- Search the web source for `Gyro`, `gyrohealth.ir`, `/brand/`, `/icons/pwa/`, and `apple-touch-icon.png`. Review each
  match rather than doing an automatic global replacement. Update the API's public-facing name or links if your fork
  also publishes the backend.
- Check generated pages, canonical URLs, Open Graph images, the PWA manifest, and browser icons in a production build.

Rebranding does not change your obligations under the code license or third-party asset licenses. It also does not
give a fork access to the private production configuration, data, or payment credentials.
