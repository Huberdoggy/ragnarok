"""
PDF ingestion utilities for the Symphonic Prompting corpus.

This script extracts per-page text from the source PDF, applies light
normalization to preserve paragraph structure, and writes two artifacts:

* app/data/symphonic_raw.txt
* app/data/symphonic_pages.jsonl

Usage (handled by nv-run.sh wrapper in this repo):
    python -m app.ingest_pdf
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
INGEST_DIR = APP_DIR / "ingest"

PDF_FILENAME = "symphonic-promptingc.pdf"
RAW_TEXT_PATH = DATA_DIR / "symphonic_raw.txt"
PAGES_JSONL_PATH = DATA_DIR / "symphonic_pages.jsonl"


@dataclass
class PageRecord:
    """Structured representation of a PDF page."""

    page_number: int
    text: str

    def to_jsonl(self) -> str:
        """Return the JSONL line for this page."""
        record = {"page": self.page_number, "text": self.text}
        return json.dumps(record, ensure_ascii=False)


def _extract_page_strings(pdf_path: Path) -> List[str]:
    """Extract raw text (with layout artifacts) for each page in the PDF."""
    pages: List[str] = []
    for page_layout in extract_pages(pdf_path):
        fragments: List[str] = []
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                fragments.append(element.get_text())
        pages.append("".join(fragments))
    return pages


def _rehyphenate(text: str) -> str:
    """Merge words broken across line endings with hyphenation."""

    def _merge(match: re.Match[str]) -> str:
        return f"{match.group(1)}{match.group(2)}"

    return re.sub(r"(\w+)-\s*\n\s*(\w+)", _merge, text)


def _normalize_whitespace(raw_text: str) -> str:
    """
    Normalize PDF text for downstream chunking.

    - Merge hyphenated line breaks.
    - Collapse internal line breaks while preserving paragraph boundaries.
    - Remove stray whitespace and control characters.
    """
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    text = _rehyphenate(text)
    # Split paragraphs on blank lines and rebuild with normalized spacing.
    blocks = re.split(r"\n\s*\n", text)
    paragraphs: List[str] = []
    for block in blocks:
        stripped = block.strip()
        if not stripped:
            continue
        # Collapse internal whitespace without destroying intentional spacing.
        lines = [line.strip() for line in stripped.splitlines() if line.strip()]
        if not lines:
            continue
        paragraph = re.sub(r"\s{2,}", " ", " ".join(lines))
        paragraphs.append(paragraph)
    return "\n\n".join(paragraphs)


def build_page_records(pdf_path: Path) -> List[PageRecord]:
    """Extract and normalize each page of the PDF into structured records."""
    raw_pages = _extract_page_strings(pdf_path)
    records: List[PageRecord] = []
    for index, raw_text in enumerate(raw_pages, start=1):
        normalized = _normalize_whitespace(raw_text)
        records.append(PageRecord(page_number=index, text=normalized))
    return records


def write_artifacts(records: Iterable[PageRecord]) -> None:
    """Persist the ingestion outputs to disk."""
    DATA_DIR.mkdir(exist_ok=True)

    pages: List[PageRecord] = list(records)
    raw_doc = "\n\n".join(record.text for record in pages if record.text)

    RAW_TEXT_PATH.write_text(raw_doc, encoding="utf-8")
    with PAGES_JSONL_PATH.open("w", encoding="utf-8") as jsonl_file:
        for record in pages:
            jsonl_file.write(record.to_jsonl() + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest the Symphonic Prompting PDF into normalized text artifacts."
    )
    parser.add_argument(
        "--pdf-path",
        type=Path,
        default=INGEST_DIR / PDF_FILENAME,
        help="Path to the source PDF (defaults to the bundled symphonic-promptingc.pdf).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path: Path = args.pdf_path
    if not pdf_path.exists():
        raise FileNotFoundError(f"Missing PDF at {pdf_path}")
    records = build_page_records(pdf_path)
    write_artifacts(records)


if __name__ == "__main__":
    main()
