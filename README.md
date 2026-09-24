# Gyro Web

Gyro Web is Gyro's Persian-first nutrition and health-tracking web application. It is a Next.js 16 Progressive Web
App (PWA) with public nutrition tools, authenticated food and meal tracking, goals, progress views, notifications,
and subscription screens.

This repository owns the frontend source, tests, build configuration, public assets, and pinned API contract. The
standalone backend lives in [CodeBase-WorkSpace/gyro-api](https://github.com/CodeBase-WorkSpace/gyro-api).

## What is included

- Next.js and React application code
- Persian marketing pages and nutrition calculators
- Authenticated food, meal, goal, progress, and profile experiences
- PWA manifest, service worker, icons, and tracked brand artwork
- Unit tests, API-call contract checks, and production build configuration

The application source is licensed under [AGPL-3.0-only](LICENSE). The Gyro name and official artwork have separate
[trademark terms](TRADEMARKS.md) and [brand-asset terms](BRAND_ASSETS.md). Independent forks must rebrand before they
are distributed or hosted as separate products. Vazirmatn remains under its [SIL OFL-1.1 license](LICENSES/Vazirmatn-OFL-1.1.txt).

## Quick start

Prerequisites: Node.js with Corepack enabled and a running local [Gyro API](https://github.com/CodeBase-WorkSpace/gyro-api).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

The development server listens on `http://localhost:3002`. The copied environment file points to the API at
`http://localhost:8080/api/v1`. Keep the API's local CORS origin and the frontend's API base URL aligned.

For a complete local journey, start the API's PostgreSQL and Redis services, run its synthetic contributor fixture,
register a fresh local account using log-only verification, and search for `Example Oat Bowl` or `Example Lentil Soup`.
To exercise billing without a payment account, enable `BILLING_DEMO_ENABLED=true` in the API's ignored `.env` file.

## Validate a change

```bash
pnpm run typecheck
pnpm run test
pnpm run contract:check
pnpm run build
```

The contract check validates direct frontend API calls against `openapi/openapi.json`. When the API contract changes,
update the pinned artifact and its recorded digest, then review the affected request and response shapes.

Generate PWA icons on macOS with:

```bash
pnpm run icons:pwa
```

## Frontend and backend boundaries

Make frontend changes here and backend changes in `gyro-api`. The private integration repository contains deployment,
production configuration, operational documentation, and the reviewed pair of application revisions. Do not copy
production data, credentials, or private environment files into this repository.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. For security reports, follow [SECURITY.md](SECURITY.md)
instead of publishing exploit details in an issue.
