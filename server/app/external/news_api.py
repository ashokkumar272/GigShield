"""News / disruption event data wrapper (mock-capable).

When ``USE_MOCK_APIS=true`` (default for Phase 1), the wrapper returns
deterministic fake data so the platform can be tested end-to-end without
hitting external services.  In production, real HTTP calls are made via
``httpx`` to the NewsAPI.

Disruption keywords scanned: strike, curfew, flood, cyclone, riot,
protest, bandh, shutdown, accident, fire, earthquake.
"""

from dataclasses import dataclass, field

import httpx

from app.config import settings

# Keywords that indicate potential income disruption for gig workers
DISRUPTION_KEYWORDS = [
    "strike",
    "curfew",
    "flood",
    "cyclone",
    "riot",
    "protest",
    "bandh",
    "shutdown",
    "accident",
    "fire",
    "earthquake",
    "waterlogging",
    "road block",
    "traffic jam",
    "storm",
    "heavy rain",
]


@dataclass
class NewsDisruption:
    """Summary of disruption-related news for a given city."""

    city: str
    disruption_count: int                        # Number of relevant articles
    headline_keywords: list[str] = field(default_factory=list)  # Matched keywords
    top_headlines: list[str] = field(default_factory=list)       # Up to 5 headlines
    has_active_strike_or_curfew: bool = False


# ── Mock data keyed by city (lowercase) ────────────────────────────────────

_MOCK_NEWS: dict[str, NewsDisruption] = {
    "mumbai": NewsDisruption(
        city="Mumbai",
        disruption_count=4,
        headline_keywords=["flood", "heavy rain", "waterlogging", "road block"],
        top_headlines=[
            "Mumbai floods: Heavy rain causes waterlogging across western suburbs",
            "Road blockage on Western Express Highway disrupts commuters",
            "Mumbai delivery workers face severe disruption due to flooding",
            "Several areas under water; BMC issues flood warning",
        ],
        has_active_strike_or_curfew=False,
    ),
    "delhi": NewsDisruption(
        city="Delhi",
        disruption_count=3,
        headline_keywords=["protest", "bandh", "curfew"],
        top_headlines=[
            "Traders' association calls for Delhi bandh over tax hike",
            "Section 144 imposed in central Delhi following protests",
            "Traffic disruption as protest march occupies Ring Road",
        ],
        has_active_strike_or_curfew=True,
    ),
    "chennai": NewsDisruption(
        city="Chennai",
        disruption_count=3,
        headline_keywords=["cyclone", "heavy rain", "storm"],
        top_headlines=[
            "Cyclone warning issued for Tamil Nadu coast",
            "Heavy rain lashes Chennai; schools shut for two days",
            "NDRF teams deployed as cyclone approaches Chennai",
        ],
        has_active_strike_or_curfew=False,
    ),
    "bangalore": NewsDisruption(
        city="Bangalore",
        disruption_count=1,
        headline_keywords=["traffic jam"],
        top_headlines=[
            "Outer Ring Road sees unusual congestion during morning rush",
        ],
        has_active_strike_or_curfew=False,
    ),
    "kolkata": NewsDisruption(
        city="Kolkata",
        disruption_count=2,
        headline_keywords=["waterlogging", "flood"],
        top_headlines=[
            "EM Bypass waterlogged after overnight rain",
            "Low-lying areas in Kolkata flooded; rescue operations underway",
        ],
        has_active_strike_or_curfew=False,
    ),
}

_DEFAULT_MOCK = NewsDisruption(
    city="Unknown",
    disruption_count=0,
    headline_keywords=[],
    top_headlines=[],
    has_active_strike_or_curfew=False,
)


async def get_disruption_news(city: str) -> NewsDisruption:
    """Fetch disruption-related news for *city*.

    In mock mode, returns deterministic data from ``_MOCK_NEWS``.
    In live mode, calls the NewsAPI.

    Args:
        city: City name (case-insensitive).

    Returns:
        A ``NewsDisruption`` instance summarising current disruption news.
    """
    if settings.use_mock_apis:
        return _MOCK_NEWS.get(city.lower(), _DEFAULT_MOCK)

    # ── Live API call via NewsAPI ────────────────────────────────────────
    if not settings.newsapi_key:
        return _DEFAULT_MOCK

    keyword_query = " OR ".join(DISRUPTION_KEYWORDS[:8])  # Stay within URL limits
    query = f"({keyword_query}) AND {city}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 10,
                "apiKey": settings.newsapi_key,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    articles = data.get("articles", [])
    matched_keywords: list[str] = []
    headlines: list[str] = []
    has_strike_curfew = False

    for article in articles[:10]:
        title = (article.get("title") or "").lower()
        description = (article.get("description") or "").lower()
        combined = title + " " + description

        matched = [kw for kw in DISRUPTION_KEYWORDS if kw in combined]
        if matched:
            matched_keywords.extend(matched)
            headlines.append(article.get("title", ""))
            if any(kw in combined for kw in ("strike", "curfew", "bandh", "shutdown", "riot")):
                has_strike_curfew = True

    unique_keywords = list(dict.fromkeys(matched_keywords))  # preserve order, dedupe

    return NewsDisruption(
        city=city,
        disruption_count=len(headlines),
        headline_keywords=unique_keywords[:10],
        top_headlines=headlines[:5],
        has_active_strike_or_curfew=has_strike_curfew,
    )
