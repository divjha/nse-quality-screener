# NSE Quality Screener — Research & Data Architecture

## Product objective
A research platform that discovers quality NSE-listed businesses, evaluates fundamentals and valuation, ingests material news/disclosures, and produces evidence-backed watchlist decisions. It is not an auto-trading system or a headline-driven buy/sell signal generator.

## Research workflow
1. Universe: NSE-listed equities; include established mid-caps; exclude illiquid/speculative microcaps using configurable liquidity, market-cap and listing-history gates.
2. Identity resolution: map NSE symbol, BSE scrip code, ISIN, company name and corporate-action history to one canonical company record.
3. Source ingestion: retrieve permitted exchange disclosures, financial results, annual reports, investor presentations, shareholding patterns and regulatory notices. Record source URL, exchange, filing type, publication time, period covered, document hash and retrieval time.
4. Document extraction: parse XBRL/CSV first where available; PDF extraction second. Preserve original document and extracted values. Never silently overwrite a revised filing.
5. Normalisation: store standalone and consolidated statements separately; quarterly, half-yearly and annual periods separately; units/currency and restatements explicitly.
6. Fundamental engine: sector-specific metrics and quality/growth/financial-strength scores. Missing or stale data is marked unknown and reduces confidence; it must not receive a neutral or positive score by default.
7. Valuation engine: compare current multiples with own history, peers and conservative intrinsic-value scenarios; calculate margin of safety.
8. News & event intelligence: ingest exchange announcements and licensed/public news feeds; deduplicate; classify event; link to issuer; extract claims; assign materiality and confidence; link every claim to source evidence.
9. Analyst workflow: show what changed, why it matters, which financial assumptions may be affected, and what needs verification. News alone never changes fundamental score.
10. Decision output: Research candidate / Watch / Attractive valuation / Avoid or insufficient evidence. No automatic trade execution.

## Source hierarchy
- Tier 1: NSE and BSE filings, company annual reports, audited financial statements, investor presentations, SEBI orders/circulars.
- Tier 2: company investor-relations pages and earnings-call transcripts.
- Tier 3: reputable business news and data vendors, clearly labelled secondary sources.
- Social media and unverified commentary are leads only, never financial facts.

## Initial sector metric sets
### Banks
ROA, ROE, NIM, loan growth, deposit growth, CASA, GNPA, NNPA, slippage, credit cost, provision coverage, capital adequacy/CET1, LCR, cost-to-income, unsecured/retail mix, restructuring and contingent provisions.
### Non-financial companies
Revenue and volume growth, EBITDA margin, PAT growth, ROCE, ROE, CFO/PAT, free cash flow, net debt/EBITDA, interest coverage, working-capital days, dilution, capex returns and segment mix.
### NBFCs
AUM growth, NIM/spread, cost of funds, GNPA/NNPA, credit cost, collection efficiency, ALM/liquidity, capital adequacy, leverage and borrowing concentration.
### Insurance
APE/premium growth, VNB, VNB margin, persistency, solvency, combined ratio (general insurance), embedded value and product/channel mix.
### IT services
Revenue growth, constant-currency growth, EBIT margin, utilisation, attrition, deal wins, order book, client concentration, cash conversion and guidance.
### Industrials/manufacturing
Order book, execution/revenue conversion, margins, working capital, ROCE, capex, debt, customer concentration and cash conversion.

## News/event taxonomy
Results/guidance; order wins/cancellations; management changes; promoter/shareholding/pledge; related-party transactions; auditor resignation/qualification; regulatory/legal action; credit rating; fundraising/dilution; M&A; capex; plant disruption; cyber/security; litigation; dividend/buyback; corporate actions; macro/sector developments.

## Data quality and controls
- Store raw source artefacts separately from parsed/normalised facts.
- Every metric must have source, period, unit, consolidation basis, reported/derived flag and last-updated timestamp.
- Preserve original and revised filings; flag restatements.
- Cross-check NSE and BSE filings where both are available.
- Reconcile reported totals and ratios; flag outliers rather than silently correcting them.
- Display freshness and completeness indicators.
- Keep audit trail for every score change and analyst override.
- Never fabricate missing data or imply live data where only delayed/manual data exists.

## Compliance and access
- Do not scrape NSE/BSE sites or bypass anti-bot controls.
- Use official downloadable datasets where their terms permit, authorised APIs/data vendors, issuer investor-relations downloads, and user-uploaded documents.
- Review each provider's licence, permitted caching, display, redistribution and commercial-use conditions before integration.
- Keep API keys server-side; never embed secrets in the static web app or GitHub.
- Public news snippets should be brief, attributed and linked to the original publisher; store metadata and our own analysis rather than republishing articles.

## Proposed architecture
- Mobile-first React/TypeScript frontend (static hosting).
- Backend API and scheduled ingestion workers (e.g. .NET or Python).
- PostgreSQL for companies, filings, facts, news, scores and audit history.
- Object storage for source PDFs/XBRL artefacts.
- Queue/job scheduler for ingestion, parsing and refresh.
- Provider adapters so NSE/BSE/vendor integrations can be swapped without rewriting scoring logic.

## Delivery phases
1. Data model and sector-specific scoring with manual CSV/document upload.
2. Exchange filing link catalogue and ingestion of permitted downloadable filings.
3. XBRL/CSV parser, PDF extraction and validation/reconciliation.
4. News/event ingestion and issuer/entity matching.
5. Historical financials, peer comparisons and valuation/fair-value scenarios.
6. Scheduled refresh, alerts, provenance and audit dashboard.

## Important limitation of current v0.1
The current repository is a static HTML application using browser localStorage. It has no backend, database, scheduled jobs or secure server-side secret storage. True automated ingestion requires adding a backend and data-provider agreements/credentials where applicable. Do not claim that the current frontend fetches live NSE/BSE data.
