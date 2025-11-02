"""
FastAPI application that exposes Symphonic Prompting retrieval endpoints.

Run with:
    nv-run.sh python -m app.api.server
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
import uvicorn

from app.api.retrieval_service import retrieve, RetrievalResult

LOGGER = logging.getLogger(__name__)

API_TITLE = "Symphonic Prompting API"
API_DESCRIPTION = (
    "Local-only retrieval service powering the Symphonic Prompting interface."
)
DEFAULT_TOP_K = 5
MAX_TOP_K = 10


class SearchRequest(BaseModel):
    """Validated request payload for /api/search."""

    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(..., min_length=1, max_length=600)
    top_k: int = Field(DEFAULT_TOP_K, ge=1, le=MAX_TOP_K)
    rerank: bool = Field(True)

    @field_validator("query")
    @classmethod
    def _ensure_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Query must not be empty.")
        return value.strip()


class SearchResponseItem(BaseModel):
    """Shape of individual retrieval results returned to the UI."""

    id: str
    score: float
    page_start: int
    page_end: int
    start_char: int
    end_char: int
    preview: str


app = FastAPI(title=API_TITLE, description=API_DESCRIPTION, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health", summary="Health probe")
def health() -> dict[str, str]:
    """Basic readiness endpoint for smoke tests."""
    return {"status": "ok"}


@app.post(
    "/api/search",
    response_model=List[SearchResponseItem],
    summary="Query the Symphonic Prompting corpus",
)
def search_endpoint(payload: SearchRequest) -> List[RetrievalResult]:
    """
    Execute a semantic retrieval query against the local FAISS index.

    Raises:
        HTTPException: with status 503 if artifacts are missing, or 500 for
            any other unexpected failure.
    """
    try:
        return retrieve(query=payload.query, top_k=payload.top_k, rerank=payload.rerank)
    except FileNotFoundError as exc:
        LOGGER.exception("Retrieval artifacts missing.")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive guardrail
        LOGGER.exception("Unexpected retrieval failure.")
        raise HTTPException(status_code=500, detail="Retrieval failed.") from exc


def run() -> None:
    """Start the local-only uvicorn server."""
    uvicorn.run(
        "app.api.server:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    run()
