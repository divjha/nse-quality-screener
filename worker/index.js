const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type"
  }
});

const error = (message, status = 400) => json({ ok: false, error: message }, status);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type"
    }});
    if (request.method !== "GET") return error("Read-only API: GET requests only", 405);
    if (url.pathname === "/health") return json({
      ok: true, service: "Northstar Equity API",
      environment: env.APP_ENV || "unknown", dataMode: "database"
    });
    if (!env.DB) return error("Database binding is not configured", 503);

    try {
      if (url.pathname === "/api/companies") {
        const { results } = await env.DB.prepare(
          "SELECT c.symbol, c.isin, c.company_name, c.sector, c.exchange, COUNT(DISTINCT f.fact_id) AS fact_count, MAX(s.reported_date) AS latest_report_date FROM companies c LEFT JOIN financial_facts f ON f.symbol = c.symbol LEFT JOIN sources s ON s.source_id = f.source_id GROUP BY c.symbol ORDER BY c.company_name"
        ).all();
        return json({ ok: true, count: results.length, companies: results });
      }
      if (url.pathname === "/api/facts") {
        const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
        if (!/^[A-Z0-9&.-]{1,20}$/.test(symbol)) return error("Provide a valid NSE symbol");
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 500), 1), 2000);
        const { results } = await env.DB.prepare(
          "SELECT f.symbol, c.company_name, c.sector, f.period, f.period_type, f.consolidation, f.metric, f.value, f.unit, f.currency, s.source_name, s.source_url, s.reported_date, s.retrieved_at FROM financial_facts f JOIN companies c ON c.symbol = f.symbol JOIN sources s ON s.source_id = f.source_id WHERE f.symbol = ? ORDER BY f.period_type, f.period DESC, f.metric LIMIT ?"
        ).bind(symbol, limit).all();
        return json({ ok: true, symbol, count: results.length, facts: results });
      }
      if (url.pathname === "/api/metrics") {
        const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
        const metric = (url.searchParams.get("metric") || "").trim();
        if (!/^[A-Z0-9&.-]{1,20}$/.test(symbol) || !metric || metric.length > 80) return error("Provide valid symbol and metric parameters");
        const { results } = await env.DB.prepare(
          "SELECT f.period, f.period_type, f.consolidation, f.value, f.unit, s.source_url, s.reported_date FROM financial_facts f JOIN sources s ON s.source_id = f.source_id WHERE f.symbol = ? AND f.metric = ? ORDER BY f.period_type, f.period"
        ).bind(symbol, metric).all();
        return json({ ok: true, symbol, metric, count: results.length, observations: results });
      }
      if (url.pathname === "/api/analysis") {
        const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
        if (!/^[A-Z0-9&.-]{1,20}$/.test(symbol)) return error("Provide a valid NSE symbol");
        const { results } = await env.DB.prepare(
          "SELECT f.period, f.period_type, f.consolidation, f.metric, f.value, f.unit, s.source_url, s.reported_date FROM financial_facts f JOIN sources s ON s.source_id = f.source_id WHERE f.symbol = ? ORDER BY s.reported_date DESC"
        ).bind(symbol).all();

        const periodInfo = (period, type) => {
          const q = /^Q([1-4])\s+FY(\d{4})$/i.exec(period || "");
          if (q && type === "quarterly") return { key: "Q" + q[1], year: Number(q[2]) };
          const y = /^FY(\d{4})$/i.exec(period || "");
          if (y && type === "annual") return { key: "FY", year: Number(y[1]) };
          return null;
        };
        const latest = new Map();
        for (const row of results) {
          const key = [row.period_type, row.consolidation, row.metric, row.period].join("|");
          if (!latest.has(key)) latest.set(key, row);
        }
        const rows = [...latest.values()];
        const byComparablePeriod = new Map();
        for (const row of rows) {
          const info = periodInfo(row.period, row.period_type);
          if (!info) continue;
          byComparablePeriod.set([row.period_type, row.consolidation, row.metric, info.key, info.year].join("|"), row);
        }
        const analysis = rows.map((current) => {
          const info = periodInfo(current.period, current.period_type);
          if (!info || Number(current.value) <= 0) return { ...current, yoy_growth_percent: null, comparison: "No comparable prior-year period loaded" };
          const prior = byComparablePeriod.get([current.period_type, current.consolidation, current.metric, info.key, info.year - 1].join("|"));
          if (!prior || Number(prior.value) <= 0) return { ...current, yoy_growth_percent: null, comparison: "No comparable prior-year period loaded" };
          return {
            ...current,
            yoy_growth_percent: Number(((Number(current.value) / Number(prior.value) - 1) * 100).toFixed(2)),
            prior_period: prior.period,
            prior_value: prior.value,
            comparison: "Calculated from same metric, period type and consolidation basis"
          };
        });
        return json({ ok: true, symbol, count: analysis.length, analysis });
      }
      return error("Route not found", 404);
    } catch (cause) {
      return json({ ok: false, error: "Database request failed", detail: env.APP_ENV === "development" ? cause.message : undefined }, 500);
    }
  }
};
