from datetime import date

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_entries_seed_data_present():
    response = client.get("/api/entries")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


def test_create_entry_and_retrieve_via_filter():
    payload = {
        "date": date(2026, 4, 14).isoformat(),
        "person": "Test User",
        "team": "Engineering",
        "activity": "Write API tests",
        "category": "Development",
        "duration_minutes": 60,
        "notes": "Testing create endpoint",
    }
    create_resp = client.post("/api/entries", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["id"] is not None

    list_resp = client.get("/api/entries", params={"person": "Test User"})
    assert list_resp.status_code == 200
    listed = list_resp.json()
    assert any(e["id"] == created["id"] for e in listed)


def test_update_entry():
    payload = {
        "date": date(2026, 4, 14).isoformat(),
        "person": "Update User",
        "team": "Engineering",
        "activity": "Initial activity",
        "category": "Development",
        "duration_minutes": 30,
        "notes": None,
    }
    create_resp = client.post("/api/entries", json=payload)
    created = create_resp.json()

    update_payload = {"activity": "Updated activity", "duration_minutes": 45}
    update_resp = client.put(f"/api/entries/{created['id']}", json=update_payload)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["activity"] == "Updated activity"
    assert updated["duration_minutes"] == 45


def test_delete_entry():
    payload = {
        "date": date(2026, 4, 14).isoformat(),
        "person": "Delete User",
        "team": "Engineering",
        "activity": "To be deleted",
        "category": "Development",
        "duration_minutes": 15,
        "notes": None,
    }
    create_resp = client.post("/api/entries", json=payload)
    created = create_resp.json()

    delete_resp = client.delete(f"/api/entries/{created['id']}")
    assert delete_resp.status_code == 204

    get_resp = client.put(f"/api/entries/{created['id']}", json={"activity": "Should fail"})
    assert get_resp.status_code == 404


def test_validation_error_negative_duration():
    payload = {
        "date": date(2026, 4, 14).isoformat(),
        "person": "Invalid User",
        "team": "Engineering",
        "activity": "Invalid duration",
        "category": "Development",
        "duration_minutes": -5,
        "notes": None,
    }
    response = client.post("/api/entries", json=payload)
    assert response.status_code == 422
