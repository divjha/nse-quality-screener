# Northstar Metric Dictionary

This file defines how the research desk should interpret common metrics. It is a methodology reference, not a claim that every metric is currently populated for every company.

## Universal rules

- Keep standalone and consolidated facts separate.
- Store the exact reporting period and period type; do not mix quarterly, annual and trailing-twelve-month values.
- Preserve units and currency. Convert only with an explicit documented conversion.
- Every fact must retain source name, source URL and report date.
- A blank means unavailable or not yet verified. It never means zero.
- Never compare ratios across companies until their definitions, scope and reporting basis are checked.
- Historical year-end valuation is not a substitute for current valuation.
- Do not calculate a score when required inputs are missing or materially incomparable.

## Banks

| Metric | Interpretation | Direction / caution |
|---|---|---|
| ROA | Profitability relative to average assets | Higher is generally stronger; compare same basis |
| ROE | Return earned on shareholder equity | Higher can be good, but leverage and capital matter |
| NIM | Net interest income relative to interest-earning assets | Higher can support profitability; mix and rate cycle matter |
| GNPA | Gross non-performing assets ratio | Lower is generally better |
| NNPA | Net non-performing assets ratio after provisions | Lower is generally better |
| Credit cost | Credit provisions relative to average loans | Lower is generally better, but cycle matters |
| CASA | Current and savings account share of deposits | Higher may reduce funding costs; not an absolute quality score |
| Capital adequacy | Regulatory capital relative to risk-weighted assets | Higher provides a buffer; compare CET1 and total CAR separately |
| Loan growth | Growth in advances | Assess against deposit growth, underwriting and capital |
| Deposit growth | Growth in deposits | Compare with loan growth and funding cost |

## NBFCs

- AUM growth, disbursements, collection efficiency, stage 2/3 assets, GNPA/NNPA, credit cost, capital adequacy, borrowing mix and ALM gaps.
- Do not apply bank CASA/NIM assumptions without checking the NBFC business model.
- Separate secured and unsecured portfolios where possible.

## IT services

- Revenue growth (constant currency and reported), EBIT margin, operating cash flow, free cash flow, deal wins/book-to-bill where disclosed, attrition, client concentration and cash conversion.
- Adjust for acquisitions, divestitures and currency effects before judging organic growth.

## Manufacturing / industrials

- Revenue and volume growth, EBITDA/EBIT margin, ROCE, working-capital days, net debt/EBITDA, capacity utilisation, order inflow and order book where relevant.
- Check cash conversion and receivables; accounting profit without cash conversion needs investigation.

## Consumer

- Volume growth versus price/mix, gross margin, EBITDA margin, distribution reach, market share where independently supported, working capital and cash conversion.
- Separate organic growth from acquisitions and discontinued operations.

## Healthcare / pharma

- Domestic and export growth, product/geography concentration, gross margin, R&D intensity, regulatory observations, patent exposure, cash conversion and litigation/contingent liabilities.
- A regulatory warning or product-specific issue must be assessed in context; do not convert headlines into a numeric score without evidence.

## Valuation

- P/E: price relative to earnings; less useful with cyclical or temporarily depressed/negative earnings.
- P/B: price relative to book value; often more relevant for banks and financials, but ROE and asset quality matter.
- EV/EBITDA: useful for comparing operating businesses with different capital structures; check leases and exceptional items.
- Free-cash-flow yield: only meaningful when cash flow is representative and capex is properly captured.
- Dividend yield: not a standalone measure of safety; check payout sustainability.
- Always label valuation date and earnings period. Historical multiples must never be presented as current.

## Technical indicators

- EMA20/50/200 describe trend, not intrinsic value.
- RSI is a momentum measure, not a standalone buy/sell trigger.
- Volume should be compared with its own historical baseline.
- Support/resistance zones are estimates and can fail.
- Backtests must use point-in-time data and include brokerage, taxes, slippage, survivorship and corporate actions.

## Source hierarchy

1. Company audited annual reports and filed quarterly results.
2. NSE/BSE corporate filings and official company investor-relations disclosures.
3. Regulator and rating-agency material, clearly labelled as such.
4. Secondary data providers only as cross-checks, not silent replacements for primary disclosures.

Official discovery links:
- NSE financial information: https://www.nseindia.com/static/nse-data-and-analytics/financial-information-disclosures
- NSE company annual reports: https://www.nseindia.com/companies-listing/corporate-filings-annual-reports
- BSE: https://www.bseindia.com/

The availability of a public filing does not automatically grant permission to scrape, redistribute or republish exchange data at scale. Follow source terms and applicable licences.
