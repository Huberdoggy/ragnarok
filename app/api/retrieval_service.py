"""
High-level retrieval entrypoint for UI integration.
"""

from __future__ import annotations

from typing import List, TypedDict

from app import search as search_module


class RetrievalResult(TypedDict):
    id: str
    score: float
    page_start: int
    page_end: int
    start_char: int
    end_char: int
    preview: str


def retrieve(query: str, top_k: int = 5, rerank: bool = True) -> List[RetrievalResult]:
    """
    Retrieve top-k passages for the given query.

    Delegates directly to app.search.search so the UI can import a simple callable
    without worrying about CLI arguments or artifact wiring.
    """
    return search_module.search(query=query, top_k=top_k, rerank=rerank)
