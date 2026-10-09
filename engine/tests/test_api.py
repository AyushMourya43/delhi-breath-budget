import json
from pathlib import Path

from fastapi.testclient import TestClient

from engine.app.main import app

client = TestClient(app)


def test_contract_examples_are_parseable_demo_json() -> None:
    examples = Path(__file__).resolve().parents[2] / "contracts" / "examples"

    for example_path in examples.glob("*.json"):
        response = json.loads(example_path.read_text(encoding="utf-8"))
        assert response["is_demo"] is True
        assert response["source"]


def test_health_reports_demo_mode_and_freshness() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["data_mode"] == "demo"
    assert response.json()["data_freshness"]["last_updated"] is None
    assert response.json()["data_freshness"]["note"]


def test_map_endpoints_follow_frontend_response_shapes() -> None:
    aqi = client.get("/api/aqi-grid")
    fires = client.get("/api/fires")
    wind = client.get("/api/wind")

    assert aqi.status_code == fires.status_code == wind.status_code == 200
    assert aqi.json()["is_demo"] is True
    assert aqi.json()["points"][0]["confidence"] > 0
    assert fires.json()["smoke_risk"]["note"]
    assert wind.json()["direction_convention"]


def test_routes_are_ranked_and_exposure_scales_with_travel_time() -> None:
    response = client.post(
        "/api/routes",
        json={
            "origin": {"name": "Connaught Place", "lat": 28.6315, "lon": 77.2167},
            "destination": {"name": "Dwarka", "lat": 28.5921, "lon": 77.046},
            "mode": "bike",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["is_demo"] is True
    assert len(body["routes"]) == 2
    assert body["routes"][0]["rank"] == 1
    assert body["routes"][0]["recommended"] is True
    assert body["routes"][0]["cigarettes"] >= 0
    assert 0 < body["routes"][0]["confidence"] <= 1
    assert body["routes"][0]["geometry"]["type"] == "LineString"
    assert "Illustration only" in body["exposure_note"]


def test_routes_reject_identical_endpoints() -> None:
    response = client.post(
        "/api/routes",
        json={
            "origin": {"lat": 28.6, "lon": 77.2},
            "destination": {"lat": 28.6, "lon": 77.2},
        },
    )

    assert response.status_code == 422


def test_routes_reject_locations_outside_monitoring_coverage() -> None:
    response = client.post(
        "/api/routes",
        json={
            "origin": {"lat": 28.6, "lon": 77.2},
            "destination": {"lat": 19.0, "lon": 72.8},
        },
    )

    assert response.status_code == 503
    assert "No reliable PM2.5 estimate" in response.json()["detail"]


def test_safe_window_has_48_hour_profile_adjusted_forecast() -> None:
    location = {"name": "Delhi", "lat": 28.6139, "lon": 77.209}
    adult = client.post(
        "/api/safe-window",
        json={"location": location, "profile": {"type": "adult", "activity": "walk"}},
    ).json()
    asthma = client.post(
        "/api/safe-window",
        json={"location": location, "profile": {"type": "asthma", "activity": "run"}},
    ).json()

    assert len(adult["hourly"]) == 48
    assert adult["is_estimate"] is True
    assert adult["best_window"]["start"] < adult["best_window"]["end"]
    assert asthma["hourly"][0]["risk_score"] >= adult["hourly"][0]["risk_score"]
    assert asthma["profile"]["type"] == "asthma"


def test_safe_window_rejects_location_outside_monitoring_coverage() -> None:
    response = client.post(
        "/api/safe-window",
        json={"location": {"name": "Mumbai", "lat": 19.0, "lon": 72.8}},
    )

    assert response.status_code == 503
    assert "No reliable PM2.5 estimate" in response.json()["detail"]


def test_advice_uses_only_supplied_numbers() -> None:
    response = client.post(
        "/api/advice",
        json={
            "profile": {"type": "child", "activity": "walk"},
            "pm25": 81,
            "best_window": "4 PM–6 PM",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["generated_by"] == "template"
    assert "81 µg/m³" in body["details"]
    assert "4 PM–6 PM" in body["details"]
    assert "cigarette-equivalents" not in body["details"]
    assert body["actions"]
