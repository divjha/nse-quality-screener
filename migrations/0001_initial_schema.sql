PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  symbol TEXT PRIMARY KEY,
  isin TEXT,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  source_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  reported_date TEXT,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content_hash TEXT,
  UNIQUE(source_url, content_hash)
);

CREATE TABLE IF NOT EXISTS financial_facts (
  fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL REFERENCES companies(symbol),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('annual','quarterly','ttm')),
  consolidation TEXT NOT NULL CHECK(consolidation IN ('standalone','consolidated')),
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  source_id INTEGER NOT NULL REFERENCES sources(source_id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, period, period_type, consolidation, metric, source_id)
);

CREATE INDEX IF NOT EXISTS idx_facts_symbol_period ON financial_facts(symbol, period_type, period);
CREATE INDEX IF NOT EXISTS idx_facts_metric ON financial_facts(symbol, metric, consolidation);
CREATE INDEX IF NOT EXISTS idx_sources_reported_date ON sources(reported_date);
