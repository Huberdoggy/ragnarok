"""
Chunking logic for Symphonic Prompting.

Reads page-level JSONL output from app/ingest_pdf and emits chunk metadata
with deterministic identifiers suitable for embedding and retrieval.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, List, Sequence


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"

PAGES_JSONL_PATH = DATA_DIR / "symphonic_pages.jsonl"
CHUNKS_JSONL_PATH = DATA_DIR / "symphonic_chunks.jsonl"

# Approximate character counts that map to the desired 700–1000 token range.
DEFAULT_TARGET_CHARS = 1400
DEFAULT_MIN_CHARS = 1100
DEFAULT_OVERLAP_RATIO = 0.15  # 10–15% overlap keeps continuity.


@dataclass
class Paragraph:
    page: int
    text: str
    start: int
    end: int


@dataclass
class Chunk:
    id: str
    text: str
    page_start: int
    page_end: int
    start_char: int
    end_char: int

    def to_jsonl(self) -> str:
        record = {
            "id": self.id,
            "text": self.text,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "start_char": self.start_char,
            "end_char": self.end_char,
        }
        return json.dumps(record, ensure_ascii=False)


def _load_pages(path: Path) -> List[dict]:
    pages: List[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            pages.append(json.loads(line))
    return pages


def _explode_paragraphs(pages: Sequence[dict]) -> List[Paragraph]:
    paragraphs: List[Paragraph] = []
    cursor = 0
    last_page_index = len(pages) - 1

    for idx, record in enumerate(pages):
        page_number = int(record["page"])
        text = record.get("text", "")
        if not text.strip():
            if idx != last_page_index:
                cursor += 2  # Account for the inter-page separator.
            continue

        parts = [part.strip() for part in text.split("\n\n") if part.strip()]
        for part_index, part in enumerate(parts):
            start = cursor
            end = start + len(part)
            paragraphs.append(
                Paragraph(page=page_number, text=part, start=start, end=end)
            )
            cursor = end
            if part_index != len(parts) - 1:
                cursor += 2  # Paragraph separator (\n\n).

        if idx != last_page_index:
            cursor += 2  # Separator between pages.

    return paragraphs


def _collect_window(
    paragraphs: Sequence[Paragraph],
    start_idx: int,
    target_chars: int,
    min_chars: int,
) -> tuple[List[Paragraph], int, int]:
    current: List[Paragraph] = []
    char_count = 0
    idx = start_idx
    total = len(paragraphs)
    while idx < total:
        para = paragraphs[idx]
        addition = len(para.text) + (2 if current else 0)
        anticipated = char_count + addition
        if current and anticipated > target_chars and char_count >= min_chars:
            break
        current.append(para)
        char_count = anticipated
        idx += 1
        if char_count >= target_chars:
            break

    if not current:
        current.append(paragraphs[start_idx])
        char_count = len(current[0].text)
        idx = min(start_idx + 1, total)

    return current, char_count, idx


def _advance_start(
    paragraphs: Sequence[Paragraph],
    start_idx: int,
    end_idx: int,
    char_count: int,
    overlap_ratio: float,
) -> int:
    if end_idx >= len(paragraphs):
        return end_idx
    overlap_chars = int(char_count * overlap_ratio)
    if overlap_chars <= 0:
        return end_idx
    overlap_limit = paragraphs[end_idx - 1].end - overlap_chars
    next_start = start_idx
    while next_start < end_idx and paragraphs[next_start].end <= overlap_limit:
        next_start += 1
    return next_start if next_start > start_idx else end_idx


def _yield_chunks(
    paragraphs: Sequence[Paragraph],
    target_chars: int,
    min_chars: int,
    overlap_ratio: float,
) -> Iterator[Chunk]:
    if not paragraphs:
        return

    chunk_index = 0
    start_idx = 0
    total_paragraphs = len(paragraphs)

    while start_idx < total_paragraphs:
        window, char_count, next_idx = _collect_window(
            paragraphs, start_idx, target_chars, min_chars
        )
        text = "\n\n".join(para.text for para in window)
        page_start = window[0].page
        page_end = window[-1].page
        chunk_id = f"sym-{chunk_index:06d}"
        chunk_index += 1
        yield Chunk(
            id=chunk_id,
            text=text,
            page_start=page_start,
            page_end=page_end,
            start_char=window[0].start,
            end_char=window[-1].end,
        )

        if next_idx >= total_paragraphs:
            break
        start_idx = _advance_start(
            paragraphs, start_idx, next_idx, char_count, overlap_ratio
        )


def build_chunks(
    pages_path: Path = PAGES_JSONL_PATH,
    output_path: Path = CHUNKS_JSONL_PATH,
    target_chars: int = DEFAULT_TARGET_CHARS,
    min_chars: int = DEFAULT_MIN_CHARS,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
) -> List[Chunk]:
    pages = _load_pages(pages_path)
    paragraphs = _explode_paragraphs(pages)
    if not paragraphs:
        output_path.parent.mkdir(exist_ok=True)
        output_path.write_text("", encoding="utf-8")
        return []
    chunks = list(_yield_chunks(paragraphs, target_chars, min_chars, overlap_ratio))
    output_path.parent.mkdir(exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        for chunk in chunks:
            handle.write(chunk.to_jsonl() + "\n")
    return chunks


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Chunk Symphonic Prompting text for retrieval."
    )
    parser.add_argument(
        "--pages-path",
        type=Path,
        default=PAGES_JSONL_PATH,
        help="Path to the pages JSONL generated by app.ingest_pdf.",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=CHUNKS_JSONL_PATH,
        help="Destination path for the chunk JSONL output.",
    )
    parser.add_argument("--target-chars", type=int, default=DEFAULT_TARGET_CHARS)
    parser.add_argument("--min-chars", type=int, default=DEFAULT_MIN_CHARS)
    parser.add_argument("--overlap", type=float, default=DEFAULT_OVERLAP_RATIO)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_chunks(
        pages_path=args.pages_path,
        output_path=args.output_path,
        target_chars=args.target_chars,
        min_chars=args.min_chars,
        overlap_ratio=args.overlap,
    )


if __name__ == "__main__":
    main()
