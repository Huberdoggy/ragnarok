from __future__ import annotations

from typing import List, Tuple

import pytest

from app.api.retrieval_service import retrieve
from app.search import ARTIFACT_STORE, search


def _fingerprint(results: List[dict]) -> List[Tuple[str, float]]:
    """Reduce results to id/score pairs for deterministic comparison."""
    return [(item["id"], round(float(item["score"]), 6)) for item in results]


@pytest.mark.skipif(not ARTIFACT_STORE.is_ready(), reason="retrieval artifacts not built")
def test_search_repeatable_without_rerank() -> None:
    query = "Symphonic Prompting doctrine"
    first = search(query, top_k=4, rerank=False)
    second = search(query, top_k=4, rerank=False)
    assert _fingerprint(first) == _fingerprint(second)


@pytest.mark.skipif(not ARTIFACT_STORE.is_ready(), reason="retrieval artifacts not built")
def test_search_repeatable_with_rerank_bridge() -> None:
    query = "Path of discovery"
    first = retrieve(query, top_k=4, rerank=True)
    second = retrieve(query, top_k=4, rerank=True)
    assert _fingerprint(first) == _fingerprint(second)


@pytest.mark.skipif(not ARTIFACT_STORE.is_ready(), reason="retrieval artifacts not built")
def test_search_results_are_sorted_and_unique() -> None:
    results = search("Ken Burns drift", top_k=5, rerank=False)
    scores = [float(item["score"]) for item in results]
    assert scores == sorted(scores, reverse=True)
    assert len({item["id"] for item in results}) == len(results)
