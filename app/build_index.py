"""
Embedding and index builder for Symphonic Prompting.

Pipeline:
    1. Load chunk metadata from app/data/symphonic_chunks.jsonl
    2. Encode chunks with intfloat/e5-large-v2 (SentenceTransformer)
    3. Persist embeddings, ids, FAISS index, and metadata manifest
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Sequence

import faiss
import numpy as np
import torch
from sentence_transformers import SentenceTransformer


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
INDEX_DIR = APP_DIR / "index"

CHUNKS_JSONL_PATH = DATA_DIR / "symphonic_chunks.jsonl"
EMBEDDINGS_PATH = INDEX_DIR / "embeddings.npy"
IDS_PATH = INDEX_DIR / "ids.json"
FAISS_INDEX_PATH = INDEX_DIR / "faiss.index"
META_PATH = INDEX_DIR / "meta.json"

DEFAULT_MODEL_NAME = "intfloat/e5-large-v2"
DEFAULT_BATCH_SIZE = 16


def _load_chunks(path: Path) -> List[dict]:
    chunks: List[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            chunks.append(json.loads(line))
    return chunks


def _prepare_texts(chunks: Sequence[dict]) -> List[str]:
    return [f"passage: {chunk['text']}" for chunk in chunks]


def _load_model(model_name: str) -> SentenceTransformer:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer(model_name, device=device)
    return model


def build_embeddings(
    chunks_path: Path = CHUNKS_JSONL_PATH,
    embeddings_path: Path = EMBEDDINGS_PATH,
    ids_path: Path = IDS_PATH,
    faiss_path: Path = FAISS_INDEX_PATH,
    meta_path: Path = META_PATH,
    model_name: str = DEFAULT_MODEL_NAME,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> None:
    chunks = _load_chunks(chunks_path)
    if not chunks:
        raise ValueError(f"No chunks found at {chunks_path}. Run app.chunking first.")

    model = _load_model(model_name)
    texts = _prepare_texts(chunks)
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    ).astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    index_count = index.ntotal
    if index_count != len(chunks):
        raise RuntimeError("Mismatch between FAISS index size and chunk count.")

    INDEX_DIR.mkdir(exist_ok=True)

    np.save(embeddings_path, embeddings)
    ids = [chunk["id"] for chunk in chunks]
    ids_path.write_text(json.dumps(ids, ensure_ascii=False, indent=2), encoding="utf-8")
    faiss.write_index(index, str(faiss_path))

    meta = {
        "model_name": model_name,
        "embedding_dimension": dim,
        "chunk_count": len(chunks),
        "built_at": datetime.now(tz=timezone.utc).isoformat(),
        "paths": {
            "chunks": str(chunks_path),
            "embeddings": str(embeddings_path),
            "ids": str(ids_path),
            "faiss": str(faiss_path),
        },
        "batch_size": batch_size,
        "device": str(model.device),
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build FAISS index for Symphonic Prompting chunks."
    )
    parser.add_argument("--chunks-path", type=Path, default=CHUNKS_JSONL_PATH)
    parser.add_argument("--embeddings-path", type=Path, default=EMBEDDINGS_PATH)
    parser.add_argument("--ids-path", type=Path, default=IDS_PATH)
    parser.add_argument("--faiss-path", type=Path, default=FAISS_INDEX_PATH)
    parser.add_argument("--meta-path", type=Path, default=META_PATH)
    parser.add_argument("--model-name", type=str, default=DEFAULT_MODEL_NAME)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_embeddings(
        chunks_path=args.chunks_path,
        embeddings_path=args.embeddings_path,
        ids_path=args.ids_path,
        faiss_path=args.faiss_path,
        meta_path=args.meta_path,
        model_name=args.model_name,
        batch_size=args.batch_size,
    )


if __name__ == "__main__":
    main()
