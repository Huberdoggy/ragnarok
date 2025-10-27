"""
Search utilities for the Symphonic Prompting corpus.

`search` is the primary entrypoint. It returns a list of dictionaries with the
top retrieval hits for a query. The module also exposes a CLI that prints
formatted JSON to stdout.
"""

from __future__ import annotations

import argparse
import json
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
INDEX_DIR = APP_DIR / "index"

CHUNKS_JSONL_PATH = DATA_DIR / "symphonic_chunks.jsonl"
IDS_PATH = INDEX_DIR / "ids.json"
FAISS_INDEX_PATH = INDEX_DIR / "faiss.index"

EMBED_MODEL_NAME = "intfloat/e5-large-v2"
RERANK_MODEL_NAME = "BAAI/bge-reranker-base"
DEFAULT_TOP_K = 5
DEFAULT_CANDIDATES = 50
PREVIEW_CHARS = 240


@dataclass
class ChunkRecord:
    id: str
    text: str
    page_start: int
    page_end: int
    start_char: int
    end_char: int


class ArtifactStore:
    """Lazy loader for retrieval artifacts persisted on disk."""

    def __init__(
        self,
        chunks_path: Path = CHUNKS_JSONL_PATH,
        ids_path: Path = IDS_PATH,
        faiss_path: Path = FAISS_INDEX_PATH,
        embed_model_name: str = EMBED_MODEL_NAME,
    ) -> None:
        self.chunks_path = chunks_path
        self.ids_path = ids_path
        self.faiss_path = faiss_path
        self.embed_model_name = embed_model_name

        self._lock = threading.Lock()
        self._chunk_lookup: Optional[Dict[str, ChunkRecord]] = None
        self._ordered_chunks: Optional[List[ChunkRecord]] = None
        self._ids: Optional[List[str]] = None
        self._index: Optional[faiss.IndexFlatIP] = None
        self._model: Optional[SentenceTransformer] = None

    def is_ready(self) -> bool:
        return (
            self.chunks_path.exists()
            and self.ids_path.exists()
            and self.faiss_path.exists()
        )

    def _load_chunks(self) -> None:
        if self._chunk_lookup is not None and self._ordered_chunks is not None:
            return

        chunk_lookup: Dict[str, ChunkRecord] = {}
        with self.chunks_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                payload = json.loads(line)
                record = ChunkRecord(
                    id=payload["id"],
                    text=payload["text"],
                    page_start=int(payload["page_start"]),
                    page_end=int(payload["page_end"]),
                    start_char=int(payload["start_char"]),
                    end_char=int(payload["end_char"]),
                )
                chunk_lookup[record.id] = record

        self._chunk_lookup = chunk_lookup

    def _load_ids(self) -> None:
        if self._ids is not None:
            return
        ids = json.loads(self.ids_path.read_text(encoding="utf-8"))
        self._ids = ids

    def _ensure_index(self) -> None:
        if self._index is not None:
            return
        index = faiss.read_index(str(self.faiss_path))
        if not isinstance(index, faiss.IndexFlatIP):
            raise TypeError("Expected IndexFlatIP for Symphonic Prompting retrieval.")
        self._index = index

    def _ensure_ordered_chunks(self) -> None:
        if self._ordered_chunks is not None:
            return
        self._load_chunks()
        self._load_ids()
        if self._chunk_lookup is None or self._ids is None:
            raise RuntimeError("Failed to load chunks and ids.")
        ordered = []
        for chunk_id in self._ids:
            record = self._chunk_lookup.get(chunk_id)
            if record is None:
                raise KeyError(f"Chunk id {chunk_id} missing from chunk metadata.")
            ordered.append(record)
        self._ordered_chunks = ordered

    def _ensure_model(self) -> None:
        if self._model is not None:
            return
        self._model = SentenceTransformer(self.embed_model_name)

    @property
    def index(self) -> faiss.IndexFlatIP:
        with self._lock:
            self._ensure_index()
            assert self._index is not None
            return self._index

    @property
    def ordered_chunks(self) -> Sequence[ChunkRecord]:
        with self._lock:
            self._ensure_ordered_chunks()
            assert self._ordered_chunks is not None
            return self._ordered_chunks

    @property
    def model(self) -> SentenceTransformer:
        with self._lock:
            self._ensure_model()
            assert self._model is not None
            return self._model

    def encode_query(self, query: str) -> np.ndarray:
        model = self.model
        embedding = model.encode(
            [f"query: {query}"],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )[0]
        return embedding.astype("float32")


class OptionalReranker:
    """Lazy wrapper around the optional CrossEncoder reranker."""

    def __init__(self, model_name: str = RERANK_MODEL_NAME) -> None:
        self.model_name = model_name
        self._model = None
        self._load_failure: Optional[Exception] = None
        self._lock = threading.Lock()

    def is_available(self) -> bool:
        model = self._get_model()
        return model is not None

    def _get_model(self):
        if self._model is not None:
            return self._model
        if self._load_failure is not None:
            return None
        with self._lock:
            if self._model is not None:
                return self._model
            if self._load_failure is not None:
                return None
            try:
                from sentence_transformers import CrossEncoder

                self._model = CrossEncoder(self.model_name)
            except (
                Exception
            ) as exc:  # pragma: no cover - depends on local cache availability.
                self._load_failure = exc
                self._model = None
        return self._model

    def rerank(self, query: str, candidates: Sequence[dict], top_k: int) -> List[dict]:
        model = self._get_model()
        if model is None:
            return list(candidates)[:top_k]

        pairs = [(f"query: {query}", f"passage: {entry['text']}") for entry in candidates]
        scores = model.predict(pairs)
        scored = []
        for entry, score in zip(candidates, scores):
            scored.append({**entry, "score": float(score)})
        scored.sort(key=lambda item: item["score"], reverse=True)
        return scored[:top_k]


ARTIFACT_STORE = ArtifactStore()
RERANKER = OptionalReranker()


def _make_candidates(
    indices: Sequence[int], scores: Sequence[float], store: ArtifactStore
) -> List[dict]:
    ordered_chunks = store.ordered_chunks
    candidates: List[dict] = []
    for rank, (idx, score) in enumerate(zip(indices, scores)):
        if idx < 0 or idx >= len(ordered_chunks):
            continue
        chunk = ordered_chunks[idx]
        preview = chunk.text[:PREVIEW_CHARS].strip().replace("\n", " ")
        candidate = {
            "id": chunk.id,
            "score": float(score),
            "page_start": chunk.page_start,
            "page_end": chunk.page_end,
            "start_char": chunk.start_char,
            "end_char": chunk.end_char,
            "preview": preview,
            # Retain text internally for optional reranker.
            "text": chunk.text,
            "rank": rank,
        }
        candidates.append(candidate)
    return candidates


def search(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    rerank: bool = True,
    store: ArtifactStore = ARTIFACT_STORE,
) -> List[dict]:
    if top_k <= 0:
        raise ValueError("top_k must be positive.")
    if not store.is_ready():
        raise FileNotFoundError(
            "Retrieval artifacts missing. Run ingestion, chunking, and index build first."
        )

    query_vector = store.encode_query(query)
    index = store.index
    candidate_count = min(max(top_k, DEFAULT_CANDIDATES), index.ntotal)
    if candidate_count == 0:
        return []

    scores, indices = index.search(np.array([query_vector]), candidate_count)
    candidates = _make_candidates(indices[0], scores[0], store)
    if not candidates:
        return []

    if rerank:
        candidates = RERANKER.rerank(query, candidates, top_k)
        for rank, entry in enumerate(candidates):
            entry["rank"] = rank
    else:
        candidates = candidates[:top_k]
        for rank, entry in enumerate(candidates):
            entry["rank"] = rank

    # Drop internal fields before returning.
    cleaned = []
    for entry in candidates:
        cleaned.append(
            {
                "id": entry["id"],
                "score": float(entry["score"]),
                "page_start": entry["page_start"],
                "page_end": entry["page_end"],
                "start_char": entry["start_char"],
                "end_char": entry["end_char"],
                "preview": entry["preview"],
            }
        )
    return cleaned


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search the Symphonic Prompting index.")
    parser.add_argument(
        "--q", "--query", dest="query", required=True, help="Natural language query."
    )
    parser.add_argument(
        "--k", type=int, default=DEFAULT_TOP_K, help="Number of results to return."
    )
    parser.add_argument(
        "--no-rerank",
        action="store_true",
        help="Disable the optional CrossEncoder reranker.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the JSON output.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    results = search(args.query, top_k=args.k, rerank=not args.no_rerank)
    if args.pretty:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
