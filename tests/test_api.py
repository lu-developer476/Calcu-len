from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


def test_health_endpoint_has_operational_metadata():
    response = client.get("/api/health")
    data = response.json()

    assert response.status_code == 200
    assert data["ok"] is True
    assert "version" in data
    assert "uptime_seconds" in data
    assert "angle_mode" in data


def test_standard_calculation():
    response = client.post(
        "/api/calculate", json={"mode": "standard", "expression": "(2+3)*4"}
    )

    assert response.status_code == 200
    assert response.json()["result"] == "20.00000"


def test_graph_calculation_returns_datasets():
    payload = {
        "expressions": ["sin(x)", "x**2"],
        "x_min": -2,
        "x_max": 2,
        "samples": 50,
    }
    response = client.post("/api/graph", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) == 2


def test_graph_rejects_invalid_window():
    payload = {
        "expressions": ["x"],
        "x_min": 5,
        "x_max": 5,
        "samples": 50,
    }
    response = client.post("/api/graph", json=payload)

    assert response.status_code == 422


def test_scientific_defaults_to_radians():
    response = client.post(
        "/api/calculate", json={"mode": "scientific", "expression": "sin(pi/2)"}
    )

    assert response.status_code == 200
    assert response.json()["result"] == "1.00000"


def test_can_switch_angle_mode_to_degrees():
    switch = client.post("/api/angle-mode", params={"mode": "DEG"})
    assert switch.status_code == 200
    assert switch.json()["mode"] == "DEG"

    response = client.post(
        "/api/calculate", json={"mode": "scientific", "expression": "sin(90)"}
    )

    assert response.status_code == 200
    assert response.json()["result"] == "1.00000"

    restore = client.post("/api/angle-mode", params={"mode": "RAD"})
    assert restore.status_code == 200
    assert restore.json()["mode"] == "RAD"
