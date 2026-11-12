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
- GET /api/facts?symbol=SBIN — source-linked facts for one company; omit `symbol` to fetch the published universe in one request (limit capped at 10,000).
- GET /api/metrics?symbol=SBIN&metric=ROA — time series for a metric.
- GET /api/analysis?symbol=SBIN — year-over-year comparisons only where the same metric, fiscal period, period type and consolidation basis exist.

The API is intentionally read-only. No unauthenticated write endpoint is exposed.

## Local setup

1. Install Node.js LTS.
2. Run npm install.
3. Apply the local schema with npm run db:local.
4. Generate and import the current validated JSON dataset with npm run seed:local.
5. Start the API with npm run dev:api.
6. Test /health, /api/companies, /api/facts?symbol=SBIN and /api/analysis?symbol=SBIN.
7. Verify local row counts with npm run check:local.

The D1 database ID in wrangler.toml is a local-development placeholder UUID. Replace it only after creating a D1 database in the user's Cloudflare account. The seed generator validates the published JSON, retains source links and reporting metadata, and produces an idempotent SQL file. It does not fetch new market data. Do not add API tokens or credentials to Git.

## Analysis safeguards

Year-over-year calculations are returned only when the same metric has a matching prior-year quarter or fiscal year with identical period type and consolidation basis. No growth rate is inferred when a comparable period is missing or the prior value is non-positive. This is historical comparison, not a forecast.

## Deployment safety

Cloudflare free-tier limits are not unlimited. Monitor requests, CPU, D1 reads/writes and storage. Do not enable paid billing or add a payment method for this project without explicit approval.

## Data-source policy

This API does not scrape NSE pages or pretend to have a live quote feed. Financial facts must retain source URL, reporting date, period, unit, currency and consolidation basis. Market prices require a permitted provider with explicit access and usage terms. No provider key is required by this initial scaffold.

## Frontend connection and fallback

The Data Centre includes an optional API base URL field. Leave it blank to keep using the published static JSON dataset. After a Worker and D1 database are actually deployed and seeded, enter the HTTPS Worker base URL and use **Test connection**. The frontend checks `/health`, reads `/api/companies`, then fetches the published facts in one `/api/facts?limit=10000` request to avoid one request per company. If the API is unavailable or the database is not configured, it falls back to the static dataset and shows that state in the connection status.

The API URL is stored in browser localStorage only. No credentials or API tokens are requested or stored. The static fallback remains the default until the user configures a URL.
