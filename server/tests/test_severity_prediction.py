"""Tests for ML severity prediction endpoint."""

import pytest
from httpx import AsyncClient


@pytest.fixture
def severity_payload() -> dict:
    return {
        "distance_km": 6.5,
        "weather_condition": "clear",
        "traffic_level": "medium",
        "vehicle_type": "bike",
        "temperature_c": 30.0,
        "humidity_pct": 65.0,
        "precipitation_mm": 1.2,
        "preparation_time_min": 18.0,
        "courier_experience_yrs": 3.0,
        "worker_age": 28,
        "worker_rating": 4.5,
        "order_type": "delivery",
        "weather_risk": 0.35,
        "traffic_risk": 0.45,
        "severity_score": 55.0,
    }


@pytest.mark.asyncio
async def test_predict_severity_requires_auth(
    client: AsyncClient,
    severity_payload: dict,
) -> None:
    response = await client.post(
        "/api/v1/pricing/predict-severity",
        json=severity_payload,
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_predict_severity_success(
    client: AsyncClient,
    auth_headers: dict,
    severity_payload: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakePrediction:
        predicted_severity_score_scaled = 0.9123
        predicted_severity_score = 61.24

    def fake_predict(_: dict) -> FakePrediction:
        return FakePrediction()

    monkeypatch.setattr(
        "app.routers.pricing.predict_severity_from_model",
        fake_predict,
    )

    response = await client.post(
        "/api/v1/pricing/predict-severity",
        headers=auth_headers,
        json=severity_payload,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["predicted_severity_score_scaled"] == 0.9123
    assert data["predicted_severity_score"] == 61.24
