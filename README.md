# Gyro Web

Gyro Web is the Next.js application and installable Progressive Web App (PWA). This directory owns its runtime source,
tests, build configuration, and public assets without relying on files from the parent repository.

The application source is licensed under [AGPL-3.0-only](LICENSE). Read [the contribution guide](CONTRIBUTING.md)
before proposing changes. The [trademark notice](TRADEMARKS.md) separates the software license from permission to
present a fork as the official Gyro service. Independent builds must [replace the official branding](docs/rebranding.md).
The official logo and app icons have [separate narrow terms](BRAND_ASSETS.md). Bundled fonts retain their separate
license, noted below.

## Run locally

Install dependencies and create an untracked local environment file:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Start the application on port `3002`:

```bash
pnpm run dev
```

The API configured in `.env.local` must be running separately. Both API base URL variables must end in `/api/v1`.
For a browser test with real API responses, follow the standalone API's local setup and optional synthetic-food fixture,
register a fresh local account using its log-only verification flow, and search for `Example Oat Bowl`. The frontend's
unit tests, typecheck, contract check, and build do not require an API or database. To test billing in a browser, set
`BILLING_DEMO_ENABLED=true` in the API's ignored `.env` and restart it. The resulting local checkout page can simulate
success, failure, or pending without a PayPing account or a real charge.

## Validate changes

```bash
pnpm run typecheck
pnpm run test
pnpm run contract:check
pnpm run build
```

Generate PWA icons on macOS with `pnpm run icons:pwa`. The script and its default source image live inside this
directory, so it also works after the public-repository extraction.

## API contract pin

`openapi/openapi.json` currently copies the backend's Phase 1 candidate artifact. Replace it with an immutable
`gyro-api` release artifact at public cutover. `openapi/source.json` records its API version and SHA-256 digest.
`pnpm run contract:check` checks the digest and compares direct frontend API calls with the contract's routes and
methods. When upgrading the API, replace the artifact, update its digest, run the check, and review request and
response shapes in the affected modules. The current check is temporary and does not prove field-level DTO
compatibility.

## Public product identifiers

The source intentionally contains `gyrohealth.ir` and `app.gyrohealth.ir` as the official production hostnames used for
canonical metadata and host routing. They are public product identifiers, not deployment credentials. Deployed API
origins, analytics identifiers, and verification tokens remain environment configuration.

## Asset release gate

The application cannot be published until every asset category has a recorded redistribution decision. See
[the asset inventory](./docs/asset-redistribution.md) before producing a public export.
The bundled Vazirmatn fonts remain under their separate [SIL OFL-1.1 license](./LICENSES/Vazirmatn-OFL-1.1.txt),
regardless of the license selected for Gyro Web's application code.
