from fastapi.testclient import TestClient

from app.api.server import app


def test_health_endpoint() -> None:
    """Health endpoint should return an OK payload for readiness checks."""
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
