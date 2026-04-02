"""Traffic congestion data wrapper (mock-capable).

When ``USE_MOCK_APIS=true`` (default for Phase 1), the wrapper returns
deterministic fake data so the platform can be tested end-to-end without
hitting external services.  In production, real HTTP calls are made via
``httpx`` to the TomTom Traffic API.
"""

from dataclasses import dataclass, field

import httpx

from app.config import settings


@dataclass
class TrafficData:
    """Traffic conditions for a given city."""

    city: str
    congestion_level: float  # 0–100 (0 = free-flow, 100 = gridlock)
    incident_count: int       # Number of active traffic incidents
    major_incidents: list[str] = field(default_factory=list)  # Descriptions
    description: str = ""


# ── Mock data keyed by city (lowercase) ────────────────────────────────────

_MOCK_TRAFFIC: dict[str, TrafficData] = {
    "mumbai": TrafficData(
        city="Mumbai",
        congestion_level=85.0,
        incident_count=12,
        major_incidents=["Road blockage on Western Express Highway", "Waterlogging at Hindmata"],
        description="Severe congestion due to rain-related waterlogging",
    ),
    "delhi": TrafficData(
        city="Delhi",
        congestion_level=75.0,
        incident_count=8,
        major_incidents=["Protest march on Ring Road", "Accident near India Gate"],
        description="Heavy traffic due to protest and accident",
    ),
    "chennai": TrafficData(
        city="Chennai",
        congestion_level=70.0,
        incident_count=6,
        major_incidents=["Cyclone preparedness road closures"],
        description="Moderate to severe traffic due to cyclone precautions",
    ),
    "bangalore": TrafficData(
        city="Bangalore",
        congestion_level=55.0,
        incident_count=4,
        major_incidents=["IT corridor peak hour jam"],
        description="Moderate congestion on Outer Ring Road",
    ),
    "kolkata": TrafficData(
        city="Kolkata",
        congestion_level=60.0,
        incident_count=5,
        major_incidents=["Waterlogging on EM Bypass"],
        description="Moderate congestion due to waterlogging",
    ),
}

_DEFAULT_MOCK = TrafficData(
    city="Unknown",
    congestion_level=30.0,
    incident_count=1,
    major_incidents=[],
    description="Normal traffic conditions",
)


async def get_traffic(city: str) -> TrafficData:
    """Fetch traffic data for *city*.

    In mock mode, returns deterministic data from ``_MOCK_TRAFFIC``.
    In live mode, calls the TomTom Traffic API.

    Args:
        city: City name (case-insensitive).

    Returns:
        A ``TrafficData`` instance with current conditions.
    """
    if settings.use_mock_apis:
        return _MOCK_TRAFFIC.get(city.lower(), _DEFAULT_MOCK)

    # ── Live API call via TomTom Traffic API ────────────────────────────
    if not settings.tomtom_api_key:
        return _DEFAULT_MOCK

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Use TomTom Flow Segment API to get congestion for a city centre
        # We approximate city centres with well-known lat/lon pairs
        city_coords: dict[str, tuple[float, float]] = {
            "mumbai": (19.076, 72.877),
            "delhi": (28.644, 77.216),
            "chennai": (13.082, 80.270),
            "bangalore": (12.971, 77.594),
            "kolkata": (22.572, 88.363),
            "hyderabad": (17.385, 78.487),
            "pune": (18.520, 73.856),
        }
        lat, lon = city_coords.get(city.lower(), (20.5937, 78.9629))  # India centre

        # Fetch traffic incidents
        incidents_resp = await client.get(
            "https://api.tomtom.com/traffic/services/5/incidentDetails",
            params={
                "key": settings.tomtom_api_key,
                "bbox": f"{lon - 0.3},{lat - 0.3},{lon + 0.3},{lat + 0.3}",
                "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}",
                "language": "en-GB",
                "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11,14",
                "timeValidityFilter": "present",
            },
        )
        incidents_resp.raise_for_status()
        incidents_json = incidents_resp.json()

        incidents = incidents_json.get("incidents", [])
        incident_count = len(incidents)
        major = [
            i["properties"]["events"][0]["description"]
            for i in incidents
            if i.get("properties", {}).get("magnitudeOfDelay", 0) >= 3
            and i.get("properties", {}).get("events")
        ][:5]

        # Approximate congestion level from incident magnitude
        congestion = min(100.0, incident_count * 7.0)

        return TrafficData(
            city=city,
            congestion_level=congestion,
            incident_count=incident_count,
            major_incidents=major,
            description=f"{incident_count} active incidents in {city}",
        )
