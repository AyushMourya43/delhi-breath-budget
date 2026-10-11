from __future__ import annotations

import math
import os
from datetime import datetime, timedelta
from typing import Literal, Optional
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

IST = ZoneInfo("Asia/Kolkata")
DEMO_NOTE = (
    "Illustrative demo data only. This is not a live measurement, medical "
    "advice, or a prediction of actual conditions."
)
PROFILE_THRESHOLDS = {
    "adult": 100.0,
    "child": 75.0,
    "elderly": 75.0,
    "asthma": 50.0,
    "outdoor_worker": 100.0,
}
PROFILE_NAMES = {
    "adult": "adult",
    "child": "child",
    "elderly": "older adult",
    "asthma": "asthma-sensitive person",
    "outdoor_worker": "outdoor worker",
}
ACTIVITY_MULTIPLIERS = {
    "walk": 1.0,
    "run": 1.8,
    "bike": 1.25,
    "commute": 1.0,
}

STATIONS = [
    {"id": "demo-anand-vihar", "name": "Anand Vihar", "lat": 28.6469, "lon": 77.3164, "pm25": 118.0},
    {"id": "demo-rohini", "name": "Rohini", "lat": 28.7324, "lon": 77.1177, "pm25": 96.0},
    {"id": "demo-punjabi-bagh", "name": "Punjabi Bagh", "lat": 28.6742, "lon": 77.1310, "pm25": 91.0},
    {"id": "demo-ito", "name": "ITO", "lat": 28.6286, "lon": 77.2410, "pm25": 79.0},
    {"id": "demo-connaught-place", "name": "Connaught Place", "lat": 28.6315, "lon": 77.2167, "pm25": 72.0},
    {"id": "demo-rk-puram", "name": "RK Puram", "lat": 28.5633, "lon": 77.1869, "pm25": 61.0},
    {"id": "demo-dwarka", "name": "Dwarka", "lat": 28.5921, "lon": 77.0460, "pm25": 54.0},
    {"id": "demo-lodhi-road", "name": "Lodhi Road", "lat": 28.5918, "lon": 77.2273, "pm25": 42.0},
]

FIRE_POINTS = [
    {"id": "demo-fire-1", "lat": 31.63, "lon": 74.87, "frp": 38.4, "confidence": "high"},
    {"id": "demo-fire-2", "lat": 31.05, "lon": 75.60, "frp": 22.1, "confidence": "nominal"},
    {"id": "demo-fire-3", "lat": 30.90, "lon": 75.85, "frp": 45.7, "confidence": "high"},
    {"id": "demo-fire-4", "lat": 30.34, "lon": 76.39, "frp": 18.9, "confidence": "nominal"},
    {"id": "demo-fire-5", "lat": 29.80, "lon": 76.40, "frp": 27.3, "confidence": "high"},
]

WIND_POINTS = [
    {"lat": 28.6139, "lon": 77.2090, "speed_kmh": 8.0, "direction_deg": 285},
    {"lat": 29.0000, "lon": 76.9000, "speed_kmh": 10.0, "direction_deg": 290},
    {"lat": 30.0000, "lon": 76.2000, "speed_kmh": 12.0, "direction_deg": 300},
    {"lat": 31.0000, "lon": 75.5000, "speed_kmh": 14.0, "direction_deg": 295},
]

app = FastAPI(
    title="Delhi Breath Budget API",
    description=(
        "API contracts for the Delhi Breath Budget prototype. The bundled "
        "implementation returns clearly labeled demo estimates until live "
        "ingestion and provider credentials are configured."
    ),
    version="0.1.0",
)
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class Location(BaseModel):
    name: str = Field(default="Selected location", max_length=120)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    origin: Location
    destination: Location
    mode: Literal["walk", "run", "bike", "commute"] = "commute"


class Profile(BaseModel):
    type: Literal["adult", "child", "elderly", "asthma", "outdoor_worker"] = "adult"
    activity: Literal["walk", "run", "bike", "commute"] = "walk"


class SafeWindowRequest(BaseModel):
    location: Location
    profile: Profile = Field(default_factory=Profile)


class AdviceRequest(BaseModel):
    profile: Profile = Field(default_factory=Profile)
    pm25: Optional[float] = Field(default=None, ge=0, le=2000)
    cigarettes: Optional[float] = Field(default=None, ge=0, le=1000)
    best_window: Optional[str] = Field(default=None, max_length=120)
    smoke_risk: Optional[str] = Field(default=None, max_length=40)


def now_ist() -> datetime:
    return datetime.now(IST).replace(second=0, microsecond=0)


def response_meta() -> dict[str, object]:
    generated_at = now_ist()
    return {
        "generated_at": generated_at.isoformat(),
        "is_demo": True,
        "source": "illustrative demo fixture",
        "note": DEMO_NOTE,
    }


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radians = math.pi / 180
    d_lat = (lat2 - lat1) * radians
    d_lon = (lon2 - lon1) * radians
    value = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1 * radians)
        * math.cos(lat2 * radians)
        * math.sin(d_lon / 2) ** 2
    )
    value = min(1.0, max(0.0, value))
    return 6371.0 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def pm25_at(lat: float, lon: float) -> tuple[float, float, float]:
    """Return an inverse-distance estimate, confidence, and nearest distance."""
    ranked = sorted(
        (
            haversine_km(lat, lon, station["lat"], station["lon"]),
            station["pm25"],
        )
        for station in STATIONS
    )[:3]
    nearest_distance = ranked[0][0]
    if nearest_distance > 35:
        return 0.0, 0.0, nearest_distance
    weighted = [
        (value, 1 / max(distance, 0.1) ** 2) for distance, value in ranked
    ]
    pm25 = sum(value * weight for value, weight in weighted) / sum(
        weight for _, weight in weighted
    )
    confidence = max(0.1, min(0.95, math.exp(-nearest_distance / 12)))
    return pm25, confidence, nearest_distance


def aqi_from_pm25(pm25: float) -> tuple[int, str]:
    breakpoints = [
        (0.0, 30.0, 0, 50, "Good"),
        (30.0, 60.0, 51, 100, "Satisfactory"),
        (60.0, 90.0, 101, 200, "Moderate"),
        (90.0, 120.0, 201, 300, "Poor"),
        (120.0, 250.0, 301, 400, "Very Poor"),
        (250.0, 500.0, 401, 500, "Severe"),
    ]
    concentration = max(0.0, min(pm25, 500.0))
    for low, high, aqi_low, aqi_high, label in breakpoints:
        if low <= concentration <= high:
            aqi = round((aqi_high - aqi_low) / (high - low) * (concentration - low) + aqi_low)
            return aqi, label
    return 500, "Severe"


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, object]:
    from engine.app.integrations.openaq_client import health_status
    return {"status": "ok", **health_status()}


@app.get("/api/aqi-grid")
def aqi_grid() -> dict[str, object]:
    # DBB_OPENAQ_V1
    from engine.app.integrations.openaq_client import get_aqi_payload
    def demo_factory():
        points = []
        for station in STATIONS:
            pm25 = float(station["pm25"])
            aqi, category = aqi_from_pm25(pm25)
            points.append(
                {
                    **station,
                    "pm25": round(pm25, 1),
                    "aqi": aqi,
                    "category": category,
                    "confidence": 0.9,
                    "nearest_station_km": 0.0,
                    "is_estimated": False,
                }
            )
        return {
            **response_meta(),
            "data_freshness": {
                "last_updated": None,
                "age_minutes": None,
            },
            "points": points,
        }

    return get_aqi_payload(demo_factory, aqi_from_pm25)


@app.get("/api/fires")
def fires() -> dict[str, object]:
    # DBB_FIRE_FORECAST_V1
    from engine.app.integrations.firms_live import get_fires
    return get_fires(wind)



@app.get("/api/wind")
def wind() -> dict[str, object]:
    # DBB_OPENMETEO_WIND_V1
    from engine.app.integrations.openmeteo_client import get_wind_payload
    return get_wind_payload(WIND_POINTS)


@app.post("/api/routes")
def routes(request: RouteRequest) -> dict[str, object]:
    # DBB_LIVE_ROUTES_V1
    from engine.app.services.route_live import get_routes
    return get_routes(request, aqi_grid)


@app.post("/api/safe-window")
def safe_window(request: SafeWindowRequest) -> dict[str, object]:
    from engine.app.services.forecast_live import get_forecast
    return get_forecast(request)



@app.post("/api/advice")
def advice(request: AdviceRequest) -> dict[str, object]:
    from engine.app.services.forecast_live import get_advice
    return get_advice(request)

