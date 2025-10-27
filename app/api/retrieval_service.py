"""
High-level retrieval entrypoint for UI integration.
"""

from __future__ import annotations

from typing import List, Dict

from app import search as search_module


def retrieve(query: str, top_k: int = 5, rerank: bool = True) -> List[Dict[str, object]]:
    """
    Retrieve top-k passages for the given query.

    Delegates directly to app.search.search so the UI can import a simple callable
    without worrying about CLI arguments or artifact wiring.
    """
    return search_module.search(query=query, top_k=top_k, rerank=rerank)
