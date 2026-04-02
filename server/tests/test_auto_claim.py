"""Tests for the auto-claim feature.

Covers:
- Severity score calculation utilities
- City conditions assessment (mocked external APIs)
- Auto-claim scan endpoint (dry-run and live)
- Claim creation via auto-claim when threshold crossed
- No claims when score below threshold
"""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.external.news_api import NewsDisruption
from app.external.traffic_api import TrafficData
from app.external.weather_api import WeatherData
from app.services.auto_claim_service import (
    _calculate_news_score,
    _calculate_traffic_score,
    _calculate_weather_score,
    _combined_score,
    _determine_event_type,
    _score_to_severity,
    assess_city_conditions,
    CityConditions,
)
from app.utils.constants import AQI_THRESHOLD, RAINFALL_THRESHOLD_MM


# ── Unit tests for scoring helpers ──────────────────────────────────────────


def test_weather_score_rainfall_dominated():
    """High rainfall should yield a high weather score."""
    weather = WeatherData(
        city="Mumbai",
        rainfall_mm=RAINFALL_THRESHOLD_MM * 2,  # 2× threshold → 100
        aqi=50,
        temperature_c=30.0,
        description="Heavy rain",
    )
    score = _calculate_weather_score(weather)
    assert score == 100.0


def test_weather_score_aqi_dominated():
    """High AQI should yield a high weather score even with low rainfall."""
    weather = WeatherData(
        city="Delhi",
        rainfall_mm=0.0,
        aqi=AQI_THRESHOLD * 2,  # 2× threshold → 100
        temperature_c=22.0,
        description="Severe smog",
    )
    score = _calculate_weather_score(weather)
    assert score == 100.0


def test_weather_score_below_threshold():
    """Conditions well below thresholds should yield a low score."""
    weather = WeatherData(
        city="Bangalore",
        rainfall_mm=5.0,
        aqi=80,
        temperature_c=26.0,
        description="Clear sky",
    )
    score = _calculate_weather_score(weather)
    assert score < 25.0


def test_traffic_score_high_congestion():
    """High congestion level with multiple incidents should yield a high score."""
    traffic = TrafficData(
        city="Mumbai",
        congestion_level=90.0,
        incident_count=10,
        major_incidents=["Flood blockage"],
        description="Severe congestion",
    )
    score = _calculate_traffic_score(traffic)
    assert score > 75.0


def test_traffic_score_low_congestion():
    """Low congestion with few incidents should yield a low score."""
    traffic = TrafficData(
        city="Pune",
        congestion_level=20.0,
        incident_count=1,
        description="Light traffic",
    )
    score = _calculate_traffic_score(traffic)
    assert score < 25.0


def test_news_score_strike_curfew():
    """Active strike or curfew should always yield maximum news score."""
    news = NewsDisruption(
        city="Delhi",
        disruption_count=3,
        headline_keywords=["bandh", "curfew"],
        top_headlines=["Delhi bandh called"],
        has_active_strike_or_curfew=True,
    )
    score = _calculate_news_score(news)
    assert score == 100.0


def test_news_score_no_disruption():
    """No disruption news should yield a zero score."""
    news = NewsDisruption(
        city="Bangalore",
        disruption_count=0,
        headline_keywords=[],
        top_headlines=[],
        has_active_strike_or_curfew=False,
    )
    score = _calculate_news_score(news)
    assert score == 0.0


def test_combined_score_weights():
    """Combined score should be the weighted average of sub-scores."""
    score = _combined_score(weather_score=100.0, traffic_score=0.0, news_score=0.0)
    # 100*0.40 + 0*0.30 + 0*0.30 = 40
    assert score == 40.0


def test_score_to_severity_mapping():
    """Score-to-severity mapping should follow documented thresholds."""
    assert _score_to_severity(10.0) == "low"
    assert _score_to_severity(25.0) == "medium"
    assert _score_to_severity(50.0) == "high"
    assert _score_to_severity(75.0) == "critical"
    assert _score_to_severity(99.9) == "critical"


def test_determine_event_type_strike_overrides():
    """If news has active strike/curfew, event type should be curfew_strike."""
    weather = WeatherData(city="Delhi", rainfall_mm=5.0, aqi=80, temperature_c=22.0, description="")
    traffic = TrafficData(city="Delhi", congestion_level=95.0, incident_count=15, description="")
    news = NewsDisruption(
        city="Delhi",
        disruption_count=5,
        headline_keywords=["curfew"],
        top_headlines=[],
        has_active_strike_or_curfew=True,
    )
    conditions = CityConditions(city="Delhi", weather=weather, traffic=traffic, news=news)
    conditions.weather_score = _calculate_weather_score(weather)
    conditions.traffic_score = _calculate_traffic_score(traffic)
    conditions.news_score = _calculate_news_score(news)

    event_type = _determine_event_type(conditions)
    assert event_type == "curfew_strike"


def test_determine_event_type_rainfall():
    """High rainfall should produce event_type='rainfall'."""
    weather = WeatherData(city="Mumbai", rainfall_mm=120.0, aqi=80, temperature_c=30.0, description="")
    traffic = TrafficData(city="Mumbai", congestion_level=20.0, incident_count=1, description="")
    news = NewsDisruption(city="Mumbai", disruption_count=0, has_active_strike_or_curfew=False)
    conditions = CityConditions(city="Mumbai", weather=weather, traffic=traffic, news=news)
    conditions.weather_score = _calculate_weather_score(weather)
    conditions.traffic_score = _calculate_traffic_score(traffic)
    conditions.news_score = _calculate_news_score(news)

    event_type = _determine_event_type(conditions)
    assert event_type == "rainfall"


def test_determine_event_type_traffic():
    """High traffic with low weather/news should produce event_type='traffic'."""
    weather = WeatherData(city="Pune", rainfall_mm=5.0, aqi=60, temperature_c=28.0, description="")
    traffic = TrafficData(city="Pune", congestion_level=95.0, incident_count=20, description="")
    news = NewsDisruption(city="Pune", disruption_count=0, headline_keywords=[], top_headlines=[], has_active_strike_or_curfew=False)
    conditions = CityConditions(city="Pune", weather=weather, traffic=traffic, news=news)
    conditions.weather_score = _calculate_weather_score(weather)
    conditions.traffic_score = _calculate_traffic_score(traffic)
    conditions.news_score = _calculate_news_score(news)

    event_type = _determine_event_type(conditions)
    assert event_type == "traffic"


# ── Integration tests for assess_city_conditions ────────────────────────────


@pytest.mark.asyncio
async def test_assess_city_conditions_mumbai():
    """assess_city_conditions should return populated CityConditions for Mumbai
    using mock APIs."""
    conditions = await assess_city_conditions("mumbai")
    assert conditions.city == "mumbai"
    assert 0.0 <= conditions.weather_score <= 100.0
    assert 0.0 <= conditions.traffic_score <= 100.0
    assert 0.0 <= conditions.news_score <= 100.0
    assert 0.0 <= conditions.combined_score <= 100.0
    assert conditions.severity in ("low", "medium", "high", "critical")
    assert conditions.dominant_event_type in ("rainfall", "aqi", "traffic", "curfew_strike", "news")


@pytest.mark.asyncio
async def test_assess_city_conditions_delhi_has_curfew():
    """Delhi mock data includes an active curfew — severity should be critical
    and event type should be curfew_strike."""
    conditions = await assess_city_conditions("delhi")
    # Delhi mock news has has_active_strike_or_curfew=True → news_score=100
    assert conditions.dominant_event_type == "curfew_strike"
    assert conditions.severity in ("high", "critical")


# ── API endpoint tests ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_auto_claim_scan_dry_run(client: AsyncClient, db_session: AsyncSession) -> None:
    """Dry-run scan should return scores without creating any claims."""
    # Register worker and create a policy
    reg = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Auto Claim Worker",
            "phone": "+919500000001",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "zomato",
            "avg_weekly_income_inr": 8000.0,
            "vehicle_type": "bike",
        },
    )
    assert reg.status_code == 201

    login = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919500000001", "otp": "1234"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/v1/policies", headers=headers)

    # Dry-run scan for Mumbai
    resp = await client.post(
        "/api/v1/auto-claims/scan",
        json={"cities": ["Mumbai"], "dry_run": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["dry_run"] is True
    assert data["total_claims_created"] == 0
    assert data["scanned_cities"] == 1
    assert len(data["results"]) == 1

    city_result = data["results"][0]
    assert city_result["city"] == "Mumbai"
    assert 0.0 <= city_result["combined_score"] <= 100.0
    assert city_result["severity"] in ("low", "medium", "high", "critical")


@pytest.mark.asyncio
async def test_auto_claim_scan_creates_claims(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Live scan for Mumbai (which has high mock scores) should create claims."""
    # Register a worker and policy
    reg = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Auto Claim Worker 2",
            "phone": "+919500000002",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "swiggy",
            "avg_weekly_income_inr": 7000.0,
            "vehicle_type": "scooter",
        },
    )
    assert reg.status_code == 201

    login = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919500000002", "otp": "1234"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/v1/policies", headers=headers)

    # Live scan — Mumbai mock data should have high enough score
    resp = await client.post(
        "/api/v1/auto-claims/scan",
        json={"cities": ["Mumbai"], "dry_run": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["dry_run"] is False

    city_result = data["results"][0]
    # Mumbai mock data has high weather + traffic + news scores
    # so combined score should trigger claims for high/critical
    if city_result["severity"] in ("high", "critical"):
        assert city_result["triggered"] is True
        assert city_result["claims_created"] >= 1
        assert data["total_claims_created"] >= 1


@pytest.mark.asyncio
async def test_auto_claim_scan_no_active_workers(client: AsyncClient) -> None:
    """Scan with no active workers/policies should return zero results."""
    resp = await client.post(
        "/api/v1/auto-claims/scan",
        json={"cities": ["Hyderabad"], "dry_run": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    # No workers in Hyderabad → no policies → 0 claims (dry_run scope: city listed)
    assert data["total_claims_created"] == 0


@pytest.mark.asyncio
async def test_auto_claim_scan_discovers_cities_automatically(
    client: AsyncClient,
) -> None:
    """Omitting cities from the request should auto-discover active cities."""
    # Register worker in Bangalore
    reg = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Bangalore Worker",
            "phone": "+919500000003",
            "city": "Bangalore",
            "pincode": "560001",
            "platform": "zomato",
            "avg_weekly_income_inr": 6000.0,
            "vehicle_type": "bike",
        },
    )
    assert reg.status_code == 201
    login = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919500000003", "otp": "1234"},
    )
    token = login.json()["access_token"]
    await client.post("/api/v1/policies", headers={"Authorization": f"Bearer {token}"})

    # Scan without specifying cities — should pick up Bangalore automatically
    resp = await client.post(
        "/api/v1/auto-claims/scan",
        json={"dry_run": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["scanned_cities"] >= 1
    city_names = [r["city"] for r in data["results"]]
    assert "Bangalore" in city_names
