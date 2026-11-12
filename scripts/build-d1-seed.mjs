import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const inputPath = new URL("../data/generated/financial_facts.json", import.meta.url);
const outputPath = new URL("../data/generated/d1_seed.sql", import.meta.url);
const dataset = JSON.parse(await readFile(inputPath, "utf8"));

if (!Array.isArray(dataset.records) || dataset.records.length === 0) {
  throw new Error("Dataset is empty or has no records array.");
}

const quote = (value) => "'" + String(value ?? "").replace(/'/g, "''") + "'";
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const statements = [
  "-- Generated from data/generated/financial_facts.json. Re-runnable; no source facts are deleted.",
];

const companies = new Map();
const sources = new Map();
for (const fact of dataset.records) {
  if (!/^[A-Z0-9&.-]{1,20}$/.test(fact.symbol || "")) throw new Error("Invalid symbol: " + fact.symbol);
  if (!fact.company_name || !fact.sector || !fact.metric || !Number.isFinite(Number(fact.value))) {
    throw new Error("Incomplete or non-numeric financial fact for " + fact.symbol);
  }
  if (!["annual", "quarterly", "ttm"].includes(fact.period_type)) throw new Error("Invalid period_type: " + fact.period_type);
  if (!["standalone", "consolidated"].includes(fact.consolidation)) throw new Error("Invalid consolidation: " + fact.consolidation);
  if (!fact.source?.url || !fact.source.url.startsWith("https://")) throw new Error("Missing HTTPS source URL for " + fact.symbol);
  if (!validDate(fact.source.reported_date)) throw new Error("Invalid source report date for " + fact.symbol);

  companies.set(fact.symbol, fact);
  const hash = createHash("sha256").update(fact.source.url + "|" + fact.source.reported_date + "|" + fact.source.name).digest("hex");
  sources.set(hash, { ...fact.source, hash });
}

for (const [symbol, f] of companies) {
  statements.push(
    "INSERT INTO companies (symbol, isin, company_name, sector, exchange) VALUES (" +
    [symbol, f.isin || "", f.company_name, f.sector, "NSE"].map(quote).join(", ") +
    ") ON CONFLICT(symbol) DO UPDATE SET isin=excluded.isin, company_name=excluded.company_name, sector=excluded.sector, updated_at=CURRENT_TIMESTAMP;"
  );
}

for (const source of sources.values()) {
  statements.push(
    "INSERT OR IGNORE INTO sources (source_name, source_url, reported_date, content_hash) VALUES (" +
    [source.name, source.url, source.reported_date, source.hash].map(quote).join(", ") + ");"
  );
}

for (const f of dataset.records) {
  const hash = createHash("sha256").update(f.source.url + "|" + f.source.reported_date + "|" + f.source.name).digest("hex");
  const sourceLookup = "(SELECT source_id FROM sources WHERE source_url=" + quote(f.source.url) + " AND content_hash=" + quote(hash) + " LIMIT 1)";
  statements.push(
    "INSERT OR IGNORE INTO financial_facts (symbol, period, period_type, consolidation, metric, value, unit, currency, source_id) VALUES (" +
    [f.symbol, f.period, f.period_type, f.consolidation, f.metric, Number(f.value), f.unit, f.currency || "INR"].map((v) => typeof v === "number" ? String(v) : quote(v)).join(", ") +
    ", " + sourceLookup + ");"
  );
}

await writeFile(outputPath, statements.join("\n") + "\n", "utf8");
console.log("Prepared " + dataset.records.length + " facts, " + companies.size + " companies and " + sources.size + " sources.");
console.log("SQL written to data/generated/d1_seed.sql");
