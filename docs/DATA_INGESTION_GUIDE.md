# Financial data ingestion — v0.3 foundation

## What this pipeline does
The GitHub Actions workflow validates a financial facts CSV and produces:
- `data/generated/financial_facts.json`: normalised records with source provenance.
- `data/generated/data_quality_report.json`: rejected rows, warnings and duplicate-period flags.

It runs on manual dispatch, when the input CSV or parser changes, and weekly on Monday. GitHub Actions free usage is subject to the repository/account plan quotas and current GitHub limits.

## What it does not do
- It does not scrape NSE or BSE websites.
- It does not fetch market prices or claim real-time data.
- It does not parse annual-report PDFs or XBRL yet.
- It does not make buy/sell recommendations.
- It does not treat missing metrics as zero or as positive evidence.

## How to use it
1. Download a permitted financial results/factsheet file from the exchange or issuer source.
2. Populate `data/inbox/financial_facts.csv` using the header in `data/inbox/financial_facts_template.csv`.
3. Keep one row per company, reporting period, consolidation basis and metric.
4. Preserve the exact source URL, source name, reported date, unit and period.
5. Commit the CSV to the repository.
6. Open GitHub → Actions → Financial data pipeline to inspect the run.
7. Review `data/generated/data_quality_report.json`. Do not use rejected or duplicate records without review.

## CSV columns
- `symbol`: NSE symbol in uppercase where available.
- `isin`: canonical security identifier, if known.
- `company_name`, `sector`: issuer identity and sector.
- `period`: source reporting period, e.g. Q2 FY27 or FY2026.
- `period_type`: quarterly, half-yearly, annual or ttm.
- `consolidation`: consolidated, standalone or not_applicable.
- `metric`: metric name, e.g. ROA, Revenue, GNPA.
- `value`: numeric value only.
- `unit`: percent, INR, INR_crore, INR_lakh, times, days, shares, basis_points or count.
- `currency`: currency code where relevant.
- `source_name`, `source_url`, `reported_date`: provenance.

## Controls and next steps
- Duplicate metric-period records are flagged, not silently overwritten.
- Invalid rows fail the workflow.
- Raw source documents should be retained separately; this first pipeline records provenance but does not archive third-party documents.
- Next: add issuer/ISIN master mapping, XBRL parsing, PDF extraction with human review, historical period reconciliation, then connect generated facts to the dashboard.
- Never add API tokens or credentials to repository files. If a future provider requires credentials, use GitHub Actions Secrets and review its licence and permitted usage first.


## Pilot universe and source register
The initial 10-company pilot is listed in `data/reference/pilot_companies.csv`. It records NSE symbols, sector labels and issuer/exchange source landing pages. These URLs are source discovery starting points, not evidence that financial facts have already been extracted or verified. No financial values are preloaded by this registry.

Preferred source order:
1. Issuer annual report / integrated report and audited financial statements.
2. Issuer quarterly results and earnings presentations for interim context.
3. NSE/BSE corporate filings as the exchange-submitted record.
4. Secondary aggregators only as a cross-check, never as the sole source for a published fact.

For every extracted value, record the exact document URL and page/table reference in the working extraction notes. Keep standalone and consolidated values separate. Preserve original units and convert only through a documented, tested transformation. Treat restatements, demergers, acquisitions, fiscal-year differences and discontinued operations as comparability flags.

### Sector-specific extraction priorities
- Banks: deposits, advances, NIM, ROA, ROE, GNPA, NNPA, slippages, credit cost, provision coverage, CASA and capital adequacy.
- IT services: revenue, constant-currency growth, EBIT margin, attrition, large-deal TCV, cash conversion and client concentration.
- Consumer: volume growth, revenue growth, gross margin, EBITDA margin, working capital, ROCE and segment mix.
- Industrials: revenue, EBITDA margin, order inflow, order book, execution, working capital, net debt and ROCE.
- Pharmaceuticals: revenue by geography/business, product concentration, R&D, gross margin, EBITDA margin, cash conversion, regulatory observations and acquisition effects.

The pilot should first cover FY2022–FY2026 annual periods, then add quarterly periods where comparable and available. Do not calculate a five-year trend from inconsistent or unreconciled periods.
