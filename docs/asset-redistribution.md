# Frontend asset redistribution inventory

This inventory records every frontend asset class that needs an explicit redistribution decision before `gyro-web`
becomes public. A file remaining in source control does not prove that Gyro can relicense it.

| Asset class | Paths | Current release decision |
| --- | --- | --- |
| Gyro symbol and source artwork | `brand-src/`, `public/brand/`, PWA icons, `apple-touch-icon.png` | Owner attests redistribution rights; [brand-asset notice](../BRAND_ASSETS.md) permits original-project development but requires independent releases to replace official branding |
| Vazirmatn web fonts | `public/fonts/` | Verified against `@fontsource-variable/vazirmatn@5.2.8`; retain [its OFL-1.1 license](../LICENSES/Vazirmatn-OFL-1.1.txt) |
| Food illustrations | `public/icons/ic_*.svg` | Owner attests redistribution rights; commit history alone does not establish their source |
| Food imagery | `public/images/foods/` | Owner attests redistribution rights; source images were converted to WebP in `2d41f81e` |
| Lucide UI icons | `lucide-react` dependency | Third-party ISC/MIT notices must be retained in the dependency review |
| Service worker and recovery page | `public/sw.js`, `public/pwa-recovery.html` | Application source; include under the selected code license after review |

On 2026-09-23, the owner stated that the Gyro logo, food imagery, and project-specific food SVGs are theirs to
redistribute and accepted responsibility for that assertion. This records an owner attestation, not independent
provenance verification or an assignment of third-party rights. The fonts and Lucide icons remain under their own
licenses, regardless of the selected application code license.

The self-hosted font subsets were added in `a53e3331`, which names `@fontsource-variable/vazirmatn` as their source.
The previous frontend dependency was version `5.2.8`. On 2026-09-23, all three bundled WOFF2 files were SHA-256
matched to that exact package, and the copied OFL license text was byte-matched to the package's `LICENSE` file.
[Fontsource](https://fontsource.org/fonts/vazirmatn/about) also identifies OFL-1.1. [Lucide's upstream license](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
contains the ISC and Feather-derived MIT notices.

The fresh `git archive HEAD:frontend` candidate inspected on 2026-09-24 at source commit `4926ff3d` contains 26
bundled media files: 15 PNGs (3 source artwork files, 8 brand/app icons, and 4 PWA icons), 5 food WebP images,
3 food SVG illustrations, and 3 WOFF2 font subsets. The SVGs contain Inkscape generator metadata but no embedded
third-party copyright or license notice. File-type inspection found the expected PNG, WebP, SVG, and WOFF2 formats.
This inspection did not establish independent provenance for the owner-created artwork. The API source export has no
image, font, or dataset files; its Gradle wrapper JAR is tracked separately in the private export audit.

On 2026-09-24, the owner chose to keep the Gyro logo in `gyro-web`. The public source export will retain the source
artwork, rendered brand images, PWA icons, and Apple touch icon. Production and contributor builds will use the same
tracked files; no private build-time asset overlay is planned.

The owner also decided that independent forks must not reuse the Gyro logo as their branding. A source fork for
development and an independent published service are different cases. Contributors need the tracked images to build
and test the original app. Before an independent fork is distributed or hosted, its maintainer must replace the
official brand assets and product identifiers listed in [the rebranding guide](rebranding.md).

The [brand-asset notice](../BRAND_ASSETS.md) records the owner's approved narrow copyright permission for the
official logo files. The software license and trademark notice address different permissions. Do not infer broader
rights to reuse official branding from the code license.

Before publication:

- Verify the origin, author, and license of every binary and image
- Add required attribution and license texts to the public repository
- Exclude any asset whose rights are unclear
- Keep trademark permission separate from the application code license
- Re-run the inventory against the exact staged export; this source-commit inspection is not final staged approval
