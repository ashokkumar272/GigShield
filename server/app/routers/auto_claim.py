"""Auto-claim router — admin endpoint that triggers the auto-claim scan.

The scan fetches live (or mock) weather, traffic, and news data for each
active city, calculates a combined severity score, and automatically creates
income-loss claims for eligible workers when the score crosses the
parametric trigger threshold.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auto_claim import (
    AutoClaimScanRequest,
    AutoClaimScanResponse,
    CityClaimResult,
)
from app.services.auto_claim_service import run_auto_claim_scan
from app.utils.deps import get_db

router = APIRouter(prefix="/api/v1/auto-claims", tags=["Auto-Claims"])


@router.post(
    "/scan",
    response_model=AutoClaimScanResponse,
    summary="Run auto-claim scan using weather, traffic, and news APIs",
)
async def auto_claim_scan(
    payload: AutoClaimScanRequest,
    db: AsyncSession = Depends(get_db),
) -> AutoClaimScanResponse:
    """Trigger the auto-claim pipeline.

    Fetches current weather, traffic, and news conditions for each active city
    (or the cities listed in the request body), calculates a combined severity
    score, and automatically creates income-loss claims for every worker with
    an active policy in cities where the score exceeds the threshold.

    Use ``dry_run: true`` to evaluate conditions without creating any claims.

    **Score Breakdown (0–100 each):**
    - ``weather_score``: Derived from rainfall (mm) and AQI.
    - ``traffic_score``: Derived from congestion level and incident count.
    - ``news_score``:    Derived from disruption article count and keywords.
    - ``combined_score``: Weighted average (40 % weather, 30 % traffic, 30 % news).

    **Severity Mapping:**
    - 0–24   → ``low``      — no claims created
    - 25–49  → ``medium``   — claims created for rainfall / aqi events
    - 50–74  → ``high``     — claims always created
    - 75–100 → ``critical`` — claims always created
    """
    results = await run_auto_claim_scan(
        db=db,
        cities=payload.cities,
        dry_run=payload.dry_run,
    )

    city_results = [
        CityClaimResult(
            city=r.city,
            weather_score=r.weather_score,
            traffic_score=r.traffic_score,
            news_score=r.news_score,
            combined_score=r.combined_score,
            severity=r.severity,
            dominant_event_type=r.dominant_event_type,
            triggered=r.triggered,
            claims_created=r.claims_created,
            claim_ids=r.claim_ids,
        )
        for r in results
    ]

    return AutoClaimScanResponse(
        scanned_at=datetime.now(timezone.utc),
        dry_run=payload.dry_run,
        scanned_cities=len(city_results),
        total_claims_created=sum(r.claims_created for r in city_results),
        results=city_results,
    )
