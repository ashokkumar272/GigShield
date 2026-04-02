"""Auto-claim orchestration service.

Fetches current conditions from weather, traffic, and news APIs for each
active city, calculates a combined severity score, and automatically creates
income-loss claims for eligible workers when disruption thresholds are crossed.

Severity Score Calculation:
    - Weather score  (0–100): derived from rainfall mm and AQI value
    - Traffic score  (0–100): derived from congestion level and incident count
    - News score     (0–100): derived from disruption article count and keywords
    - Combined score (0–100): weighted average (40 % weather, 30 % traffic, 30 % news)

Severity Mapping:
    0–24   → low      (no auto-claim)
    25–49  → medium   (triggers for rainfall / aqi)
    50–74  → high     (always triggers)
    75–100 → critical (always triggers)
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.external.news_api import NewsDisruption, get_disruption_news
from app.external.traffic_api import TrafficData, get_traffic
from app.external.weather_api import WeatherData, get_weather
from app.models.worker import Worker
from app.services.event_engine import process_event
from app.utils.constants import (
    AQI_THRESHOLD,
    AUTO_CLAIM_SCORE_WEIGHTS,
    NEWS_DISRUPTION_THRESHOLD,
    RAINFALL_THRESHOLD_MM,
    TRAFFIC_CONGESTION_THRESHOLD,
)

logger = logging.getLogger("gigshield.auto_claim")


@dataclass
class CityConditions:
    """Aggregated external-API data for a single city."""

    city: str
    weather: WeatherData
    traffic: TrafficData
    news: NewsDisruption
    weather_score: float = 0.0
    traffic_score: float = 0.0
    news_score: float = 0.0
    combined_score: float = 0.0
    severity: str = "low"
    dominant_event_type: str = "rainfall"


@dataclass
class CityClaimResult:
    """Result of an auto-claim run for a single city."""

    city: str
    weather_score: float
    traffic_score: float
    news_score: float
    combined_score: float
    severity: str
    dominant_event_type: str
    claims_created: int
    claim_ids: list[uuid.UUID] = field(default_factory=list)
    triggered: bool = False


def _calculate_weather_score(weather: WeatherData) -> float:
    """Map rainfall mm and AQI to a 0–100 score.

    Uses the higher of the two sub-scores so the worst condition dominates.
    """
    # Rainfall: 0 mm → 0, THRESHOLD mm → 50, 2× THRESHOLD mm → 100
    rainfall_score = min(100.0, (weather.rainfall_mm / RAINFALL_THRESHOLD_MM) * 50.0)

    # AQI: 0 → 0, THRESHOLD → 50, 2× THRESHOLD → 100
    aqi_score = min(100.0, (weather.aqi / AQI_THRESHOLD) * 50.0)

    return round(max(rainfall_score, aqi_score), 2)


def _calculate_traffic_score(traffic: TrafficData) -> float:
    """Map congestion level and incident count to a 0–100 score."""
    # Congestion level is already 0–100
    congestion_score = traffic.congestion_level

    # Incidents: each adds 5 points, capped at 50
    incident_score = min(50.0, traffic.incident_count * 5.0)

    # Weighted: 70 % congestion + 30 % incidents
    raw = congestion_score * 0.70 + incident_score * 0.30
    return round(min(100.0, raw), 2)


def _calculate_news_score(news: NewsDisruption) -> float:
    """Map disruption article count and keywords to a 0–100 score."""
    if news.has_active_strike_or_curfew:
        return 100.0

    # 0 → 0, THRESHOLD → 50, 2× THRESHOLD → 100
    article_score = min(100.0, (news.disruption_count / max(NEWS_DISRUPTION_THRESHOLD, 1)) * 50.0)
    return round(article_score, 2)


def _combined_score(weather_score: float, traffic_score: float, news_score: float) -> float:
    """Compute weighted combination of the three sub-scores."""
    w = AUTO_CLAIM_SCORE_WEIGHTS
    raw = (
        weather_score * w["weather"]
        + traffic_score * w["traffic"]
        + news_score * w["news"]
    )
    return round(min(100.0, raw), 2)


def _score_to_severity(score: float) -> str:
    """Map a 0–100 score to a severity level."""
    if score >= 75.0:
        return "critical"
    if score >= 50.0:
        return "high"
    if score >= 25.0:
        return "medium"
    return "low"


def _determine_event_type(conditions: CityConditions) -> str:
    """Choose the most appropriate event type based on which sub-score is highest.

    Returns one of: ``rainfall``, ``aqi``, ``traffic``, ``curfew_strike``.
    """
    # Strike/curfew overrides everything else
    if conditions.news.has_active_strike_or_curfew:
        return "curfew_strike"

    scores = {
        "traffic": conditions.traffic_score,
        "news": conditions.news_score,
    }

    # For weather, distinguish rainfall vs AQI
    rainfall_score = min(100.0, (conditions.weather.rainfall_mm / RAINFALL_THRESHOLD_MM) * 50.0)
    aqi_score = min(100.0, (conditions.weather.aqi / AQI_THRESHOLD) * 50.0)
    if rainfall_score >= aqi_score:
        scores["rainfall"] = rainfall_score
    else:
        scores["aqi"] = aqi_score

    return max(scores, key=lambda k: scores[k])


async def assess_city_conditions(city: str) -> CityConditions:
    """Fetch all external data for *city* and calculate severity scores.

    Args:
        city: City name (case-insensitive).

    Returns:
        A populated ``CityConditions`` instance.
    """
    weather, traffic, news = (
        await get_weather(city),
        await get_traffic(city),
        await get_disruption_news(city),
    )

    conditions = CityConditions(city=city, weather=weather, traffic=traffic, news=news)
    conditions.weather_score = _calculate_weather_score(weather)
    conditions.traffic_score = _calculate_traffic_score(traffic)
    conditions.news_score = _calculate_news_score(news)
    conditions.combined_score = _combined_score(
        conditions.weather_score,
        conditions.traffic_score,
        conditions.news_score,
    )
    conditions.severity = _score_to_severity(conditions.combined_score)
    conditions.dominant_event_type = _determine_event_type(conditions)
    return conditions


async def run_auto_claim_for_city(
    db: AsyncSession,
    city: str,
    dry_run: bool = False,
) -> CityClaimResult:
    """Assess conditions for *city* and auto-create claims if warranted.

    Args:
        db: Async database session.
        city: City name.
        dry_run: When ``True``, assesses conditions but does not create claims.

    Returns:
        A ``CityClaimResult`` summarising the outcome.
    """
    conditions = await assess_city_conditions(city)

    logger.info(
        "Auto-claim assessment — city=%s weather=%.1f traffic=%.1f news=%.1f "
        "combined=%.1f severity=%s event_type=%s",
        city,
        conditions.weather_score,
        conditions.traffic_score,
        conditions.news_score,
        conditions.combined_score,
        conditions.severity,
        conditions.dominant_event_type,
    )

    result = CityClaimResult(
        city=city,
        weather_score=conditions.weather_score,
        traffic_score=conditions.traffic_score,
        news_score=conditions.news_score,
        combined_score=conditions.combined_score,
        severity=conditions.severity,
        dominant_event_type=conditions.dominant_event_type,
        claims_created=0,
    )

    if dry_run:
        return result

    claim_ids = await process_event(
        db=db,
        event_type=conditions.dominant_event_type,
        city=city,
        severity=conditions.severity,
        timestamp=datetime.now(timezone.utc),
    )

    result.claims_created = len(claim_ids)
    result.claim_ids = claim_ids
    result.triggered = len(claim_ids) > 0

    if result.triggered:
        logger.info(
            "Auto-claim triggered — city=%s event=%s severity=%s claims=%d",
            city,
            conditions.dominant_event_type,
            conditions.severity,
            len(claim_ids),
        )

    return result


async def get_active_cities(db: AsyncSession) -> list[str]:
    """Return the distinct cities that have at least one active policy.

    Args:
        db: Async database session.

    Returns:
        List of unique city names (original capitalisation from DB).
    """
    from app.models.policy import Policy

    stmt = (
        select(Worker.city)
        .join(Policy, Policy.worker_id == Worker.id)
        .where(Policy.status == "active")
        .distinct()
    )
    result = await db.execute(stmt)
    return [row[0] for row in result.fetchall()]


async def run_auto_claim_scan(
    db: AsyncSession,
    cities: list[str] | None = None,
    dry_run: bool = False,
) -> list[CityClaimResult]:
    """Run auto-claim assessment for all (or specified) active cities.

    Args:
        db: Async database session.
        cities: Optional explicit list of cities to scan. If ``None``,
                discovers cities from active policies.
        dry_run: When ``True``, assesses conditions but does not create claims.

    Returns:
        A list of ``CityClaimResult`` instances, one per scanned city.
    """
    target_cities = cities if cities is not None else await get_active_cities(db)

    if not target_cities:
        logger.info("Auto-claim scan: no active cities found, nothing to do")
        return []

    logger.info(
        "Auto-claim scan starting — cities=%s dry_run=%s",
        target_cities,
        dry_run,
    )

    results: list[CityClaimResult] = []
    for city in target_cities:
        city_result = await run_auto_claim_for_city(db=db, city=city, dry_run=dry_run)
        results.append(city_result)

    total_claims = sum(r.claims_created for r in results)
    logger.info(
        "Auto-claim scan complete — %d cities scanned, %d claims created",
        len(results),
        total_claims,
    )

    return results
