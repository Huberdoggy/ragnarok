import pytest

from app.search import ARTIFACT_STORE, search


@pytest.mark.skipif(not ARTIFACT_STORE.is_ready(), reason="retrieval artifacts not built")
def test_search_smoke():
    results = search("Symphonic Prompting", top_k=1)
    assert results, "Expected at least one retrieval hit."
    top_hit = results[0]
    assert "id" in top_hit and "preview" in top_hit
