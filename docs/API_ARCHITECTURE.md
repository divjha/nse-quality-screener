# Northstar Equity API — first backend slice

## Architecture

- Frontend: existing GitHub Pages site.
- API: Node.js-compatible Cloudflare Worker.
- Database: Cloudflare D1 (SQLite).
- Local development: Wrangler.
- Scheduled ingestion: keep the existing GitHub Actions validation pipeline initially; add a controlled D1 loader after the Worker is deployed and tested.

## Read-only endpoints

- GET /health — service health.
- GET /api/companies — published company directory and fact counts.
- GET /api/facts?symbol=SBIN — source-linked facts for one company.
- GET /api/metrics?symbol=SBIN&metric=ROA — time series for a metric.

The API is intentionally read-only. No unauthenticated write endpoint is exposed.

## Local setup

1. Install Node.js LTS.
2. Run npm install.
3. Create a local D1 database with npm run db:local.
4. Run npm run dev:api.
5. Test /health, then the data routes after loading seed data.

The D1 database ID in wrangler.toml is a placeholder. Replace it only after creating a D1 database in the user's Cloudflare account. Do not add API tokens or credentials to Git.

## Deployment safety

Cloudflare free-tier limits are not unlimited. Monitor requests, CPU, D1 reads/writes and storage. Do not enable paid billing or add a payment method for this project without explicit approval.

## Data-source policy

This API does not scrape NSE pages or pretend to have a live quote feed. Financial facts must retain source URL, reporting date, period, unit, currency and consolidation basis. Market prices require a permitted provider with explicit access and usage terms. No provider key is required by this initial scaffold.
