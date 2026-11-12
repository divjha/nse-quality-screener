import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const makeRequest = (path, method = "GET") =>
  new Request("https://northstar.test" + path, { method });

const fixture = [
  { period: "Q2 FY2027", period_type: "quarterly", consolidation: "standalone", metric: "Revenue", value: 110, unit: "INR Cr", source_url: "https://example.com/current", reported_date: "2026-10-01" },
  { period: "Q2 FY2026", period_type: "quarterly", consolidation: "standalone", metric: "Revenue", value: 100, unit: "INR Cr", source_url: "https://example.com/prior", reported_date: "2025-10-01" },
  { period: "Q2 FY2027", period_type: "quarterly", consolidation: "consolidated", metric: "Profit", value: 200, unit: "INR Cr", source_url: "https://example.com/current", reported_date: "2026-10-01" },
  { period: "Q2 FY2026", period_type: "quarterly", consolidation: "standalone", metric: "Profit", value: 100, unit: "INR Cr", source_url: "https://example.com/prior", reported_date: "2025-10-01" },
  { period: "FY2026", period_type: "annual", consolidation: "standalone", metric: "Revenue", value: 330, unit: "INR Cr", source_url: "https://example.com/annual-current", reported_date: "2026-05-01" },
  { period: "FY2025", period_type: "annual", consolidation: "standalone", metric: "Revenue", value: 300, unit: "INR Cr", source_url: "https://example.com/annual-prior", reported_date: "2025-05-01" }
];

function mockEnv(rows = fixture) {
  return {
    APP_ENV: "test",
    DB: {
      prepare() {
        return {
          bind() { return this; },
          async all() { return { results: rows }; }
        };
      }
    }
  };
}

async function readJson(response) {
  return { status: response.status, body: await response.json() };
}

test("health endpoint works without a database binding", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/health"), {}));
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "Northstar Equity API");
});

test("API is read-only and rejects non-GET methods", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/api/companies", "POST"), mockEnv()));
  assert.equal(status, 405);
  assert.match(body.error, /GET requests only/);
});

test("data routes report a missing database binding clearly", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/api/companies"), {}));
  assert.equal(status, 503);
  assert.match(body.error, /Database binding/);
});

test("facts route validates the symbol before querying", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/api/facts?symbol=bad%20symbol"), mockEnv()));
  assert.equal(status, 400);
  assert.match(body.error, /valid NSE symbol/);
});

test("analysis calculates YoY only for matching period and consolidation basis", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/api/analysis?symbol=SBIN"), mockEnv()));
  assert.equal(status, 200);
  const quarter = body.analysis.find(x => x.metric === "Revenue" && x.period === "Q2 FY2027");
  assert.equal(quarter.yoy_growth_percent, 10);
  assert.equal(quarter.prior_period, "Q2 FY2026");

  const mismatchedBasis = body.analysis.find(x => x.metric === "Profit" && x.period === "Q2 FY2027");
  assert.equal(mismatchedBasis.yoy_growth_percent, null);
  assert.match(mismatchedBasis.comparison, /No comparable/);

  const annual = body.analysis.find(x => x.metric === "Revenue" && x.period === "FY2026");
  assert.equal(annual.yoy_growth_percent, 10);
});

test("unknown routes return 404", async () => {
  const { status, body } = await readJson(await worker.fetch(makeRequest("/missing"), mockEnv()));
  assert.equal(status, 404);
  assert.match(body.error, /Route not found/);
});
