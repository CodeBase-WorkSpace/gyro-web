# Contributing to Gyro Web

Thanks for working on the web app. This repository is prepared for an open-source release but is not yet accepting outside contributions. The maintainers will publish the contribution process when the repository becomes public.

## Local setup

Follow [the web README](README.md) to install dependencies and configure a local API. Unit tests, typecheck, contract checks, and the build do not need an API. Browser journeys need the standalone API running locally. Use only the example environment and synthetic contributor data. Never commit credentials, real account data, or production configuration.

## Before a pull request

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run test
pnpm run contract:check
pnpm run build
```

If you change API calls, check them against the pinned OpenAPI artifact and coordinate with the API maintainers. Add or update tests for behavior changes. Do not copy production data or unlicensed images into the app. Review [the asset inventory](docs/asset-redistribution.md) before changing bundled media.

Keep changes focused. Explain behavior changes and include screenshots for visible UI changes. Submit only work that you have the right to contribute under the repository's `AGPL-3.0-only` license. Gyro does not require a DCO sign-off or a contributor license agreement.

For security issues, do not open a public issue containing exploit details. Follow [the security policy](SECURITY.md).
