#!/usr/bin/env python3
"""
Sidecar script for Tauri desktop app.
Accepts a PDF path as CLI arg, runs the parser, outputs JSON to stdout.
"""
import sys
import json
import os

# Add project root to path so parser module is importable
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from parser.pdf_reader import process_pdf_schedule


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: pdf_import.py <path_to_pdf>"}), file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}), file=sys.stderr)
        sys.exit(1)

    courses = process_pdf_schedule(pdf_path)
    print(json.dumps(courses, ensure_ascii=False))


if __name__ == "__main__":
    main()
