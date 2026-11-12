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
