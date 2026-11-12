#!/usr/bin/env python3
"""Unit tests for the financial facts CSV validator."""
import csv
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_dataset.py"
SPEC = importlib.util.spec_from_file_location("build_dataset", SCRIPT)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class DatasetBuilderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        builder.INBOX = root / "data" / "inbox"
        builder.OUT = root / "data" / "generated"
        builder.INPUT = builder.INBOX / "financial_facts.csv"
        builder.OUTPUT = builder.OUT / "financial_facts.json"
        builder.REPORT = builder.OUT / "data_quality_report.json"
        builder.INBOX.mkdir(parents=True)
        with builder.INPUT.open("w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=builder.REQUIRED).writeheader()

    def tearDown(self):
        self.temp.cleanup()

    def add_row(self, **overrides):
        row = {
            "symbol": "ICICIBANK", "company_name": "ICICI Bank",
            "sector": "Bank", "period": "FY2025", "period_type": "annual",
            "consolidation": "consolidated", "metric": "ROE",
            "value": "17.2", "unit": "percent", "source_name": "Annual report",
            "source_url": "https://www.icicibank.com/", "reported_date": "2025-05-01",
            "isin": "", "currency": "INR"
        }
        row.update(overrides)
        with builder.INPUT.open("a", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=builder.REQUIRED).writerow(row)

    def run_builder(self):
        try:
            builder.main()
        except SystemExit as exc:
            return exc.code
        return 0

    def read_report(self):
        return json.loads(builder.REPORT.read_text(encoding="utf-8"))

    def test_empty_file_is_labelled_empty(self):
        self.assertEqual(self.run_builder(), 0)
        self.assertEqual(self.read_report()["status"], "empty")

    def test_valid_record_is_normalised(self):
        self.add_row()
        self.assertEqual(self.run_builder(), 0)
        data = json.loads(builder.OUTPUT.read_text(encoding="utf-8"))
        self.assertEqual(data["record_count"], 1)
        self.assertEqual(data["records"][0]["symbol"], "ICICIBANK")
        self.assertEqual(data["records"][0]["value"], 17.2)

    def test_invalid_source_is_rejected(self):
        self.add_row(source_url="http://example.com/report")
        self.assertNotEqual(self.run_builder(), 0)
        report = self.read_report()
        self.assertEqual(report["input_rows_rejected"], 1)
        self.assertEqual(report["status"], "review_required")

    def test_duplicate_metric_period_is_flagged(self):
        self.add_row()
        self.add_row()
        self.assertEqual(self.run_builder(), 0)
        report = self.read_report()
        self.assertEqual(report["status"], "review_required")
        self.assertTrue(any(x.get("warning") == "duplicate_metric_period"
                            for x in report["warnings"]))


if __name__ == "__main__":
    unittest.main()
