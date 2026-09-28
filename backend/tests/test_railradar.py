from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_railradar_status():
    resp = client.get("/api/railradar/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "base_url" in data
    assert "latency_ms" in data
    assert "api.railradar.in" in data["base_url"]

def test_railradar_config_update():
    resp = client.post("/api/railradar/config", json={
        "api_key": "rr_test_key_xyz",
        "base_url": "https://api.railradar.in/v1"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["has_api_key"] is True

def test_railradar_live_train_tracking():
    resp = client.get("/api/railradar/train/12628/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["train_number"] == "12628"
    assert "telemetry" in data
    assert "speed_kmh" in data["telemetry"]
    assert "latitude" in data["telemetry"]
    assert "longitude" in data["telemetry"]
    assert "ai_intelligence" in data
    assert "natural_recovery_minutes" in data["ai_intelligence"]
    assert "confidence_score" in data["ai_intelligence"]

def test_railradar_live_station():
    resp = client.get("/api/railradar/station/NDLS/live?hours=4")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["station_code"] == "NDLS"

def test_railradar_sync():
    resp = client.post("/api/railradar/sync", json=["12628", "12951"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert "synced_count" in data
