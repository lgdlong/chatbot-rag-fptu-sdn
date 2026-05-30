from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: pypdf\n"
        "Install with: pip install pypdf"
    ) from exc


def extract_text(pdf_path: Path) -> list[str]:
    reader = PdfReader(str(pdf_path))
    pages: list[str] = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return pages


def print_matching_pages(pages: list[str], keyword: str, context_chars: int) -> None:
    keyword_lower = keyword.lower()
    found = False

    for index, text in enumerate(pages, start=1):
        pos = text.lower().find(keyword_lower)
        if pos == -1:
            continue

        found = True
        start = max(0, pos - context_chars)
        end = min(len(text), pos + len(keyword) + context_chars)
        snippet = text[start:end].replace("\r", " ").replace("\n", " ")

        print(f"--- Page {index} ---")
        safe_print(snippet)
        print()

    if not found:
        print(f"No pages matched keyword: {keyword}")


def print_page_range(pages: list[str], start_page: int, end_page: int) -> None:
    total = len(pages)
    start_page = max(1, start_page)
    end_page = min(total, end_page)

    for page_no in range(start_page, end_page + 1):
        print(f"--- Page {page_no} ---")
        safe_print(pages[page_no - 1])
        print()


def safe_print(text: str) -> None:
    encoding = sys.stdout.encoding or os.device_encoding(1) or "utf-8"
    cleaned = text.encode(encoding, errors="replace").decode(encoding, errors="replace")
    print(cleaned)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Read text from a PDF and optionally search by keyword."
    )
    parser.add_argument("pdf", type=Path, help="Path to the PDF file")
    parser.add_argument(
        "--keyword",
        help="Keyword to search for across extracted pages",
    )
    parser.add_argument(
        "--context-chars",
        type=int,
        default=300,
        help="Number of surrounding characters to print for keyword matches",
    )
    parser.add_argument(
        "--start-page",
        type=int,
        default=1,
        help="Start page for full-text output",
    )
    parser.add_argument(
        "--end-page",
        type=int,
        help="End page for full-text output",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    pages = extract_text(args.pdf)

    if args.keyword:
        print_matching_pages(pages, args.keyword, args.context_chars)
        return 0

    end_page = args.end_page or min(3, len(pages))
    print_page_range(pages, args.start_page, end_page)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
