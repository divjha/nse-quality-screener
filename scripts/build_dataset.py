#!/usr/bin/env python3
"""Validate and normalise user-supplied, permitted financial facts CSV into JSON.

This script deliberately does not scrape NSE/BSE or fetch third-party websites.
It processes source files downloaded through permitted channels by the user.
"""
import csv
import json
import hashlib
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "data" / "inbox"
OUT = ROOT / "data" / "generated"
INPUT = INBOX / "financial_facts.csv"
OUTPUT = OUT / "financial_facts.json"
REPORT = OUT / "data_quality_report.json"

REQUIRED = ["symbol", "company_name", "sector", "period", "period_type",
            "consolidation", "metric", "value", "unit", "currency", "source_name",
            "source_url", "reported_date", "isin"]
PERIOD_TYPES = {"quarterly", "annual", "half-yearly", "ttm"}
CONSOLIDATION = {"consolidated", "standalone", "not_applicable"}
ALLOWED_UNITS = {"percent", "INR", "INR_crore", "INR_lakh", "times",
                 "days", "shares", "basis_points", "count"}
SYMBOL_RE = re.compile(r"^[A-Z0-9&._-]{1,30}$")


def clean(value):
    return (value or "").strip()


def valid_source(url):
    try:
        parsed = urlparse(url)
        return parsed.scheme == "https" and bool(parsed.netloc)
    except Exception:
        return False


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if not INPUT.exists():
        INPUT.parent.mkdir(parents=True, exist_ok=True)
        INPUT.write_text(",".join(REQUIRED) + "\n", encoding="utf-8")
    rows, errors, warnings = [], [], []
    with INPUT.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [field for field in REQUIRED if field not in (reader.fieldnames or [])]
        if missing:
            raise SystemExit("CSV is missing required columns: " + ", ".join(missing))
        for line, raw in enumerate(reader, start=2):
            row = {key: clean(raw.get(key)) for key in REQUIRED}
            if not any(row.values()):
                continue
            problems = []
            if not SYMBOL_RE.fullmatch(row["symbol"].upper()):
                problems.append("invalid_symbol")
            if row["period_type"].lower() not in PERIOD_TYPES:
                problems.append("invalid_period_type")
            if row["consolidation"].lower() not in CONSOLIDATION:
                problems.append("invalid_consolidation")
            if row["unit"] not in ALLOWED_UNITS:
                problems.append("unrecognised_unit")
            try:
                value = float(row["value"].replace(",", ""))
                if not (-1e15 < value < 1e15):
                    raise ValueError()
            except (ValueError, AttributeError):
                value = None
                problems.append("invalid_numeric_value")
            try:
                datetime.strptime(row["reported_date"], "%Y-%m-%d")
            except ValueError:
                problems.append("invalid_reported_date")
            if not valid_source(row["source_url"]):
                problems.append("source_url_must_be_https")
            if not row["isin"]:
                warnings.append({"line": line, "warning": "missing_isin"})
            if problems:
                errors.append({"line": line, "symbol": row["symbol"], "errors": problems})
                continue
            record = {
                "symbol": row["symbol"].upper(),
                "isin": row["isin"].upper(),
                "company_name": row["company_name"],
                "sector": row["sector"],
                "period": row["period"],
                "period_type": row["period_type"].lower(),
                "consolidation": row["consolidation"].lower(),
                "metric": row["metric"].strip(),
                "value": value,
                "unit": row["unit"],
                "currency": row["currency"] or None,
                "source": {
                    "name": row["source_name"],
                    "url": row["source_url"],
                    "reported_date": row["reported_date"],
                },
            }
            rows.append(record)

    # Duplicate identity is flagged; we preserve both records for analyst review.
    seen, duplicates = set(), []
    for record in rows:
        key = (record["symbol"], record["period"], record["consolidation"], record["metric"])
        if key in seen:
            duplicates.append({"symbol": record["symbol"], "period": record["period"],
                               "metric": record["metric"], "warning": "duplicate_metric_period"})
        seen.add(key)

    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_file": "data/inbox/financial_facts.csv",
        "input_sha256": hashlib.sha256(INPUT.read_bytes()).hexdigest(),
        "record_count": len(rows),
        "records": rows,
    }
    report = {
        "generated_at": payload["generated_at"],
        "input_rows_accepted": len(rows),
        "input_rows_rejected": len(errors),
        "warnings": warnings + duplicates,
        "errors": errors,
        "status": ("empty" if not rows and not errors else
                   "review_required" if errors or warnings or duplicates else "passed"),
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"accepted": len(rows), "rejected": len(errors),
                      "warnings": len(warnings) + len(duplicates),
                      "output": OUTPUT.as_posix()}, indent=2))
    # Invalid rows fail the workflow so bad data is not silently published.
    if errors:
        raise SystemExit("Data validation failed. Review data_quality_report.json")


if __name__ == "__main__":
    main()
