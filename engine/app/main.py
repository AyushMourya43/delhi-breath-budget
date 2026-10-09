from __future__ import annotations

import math
import os
from datetime import datetime, timedelta
from typing import Literal
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
    pm25: float | None = Field(default=None, ge=0, le=2000)
    cigarettes: float | None = Field(default=None, ge=0, le=1000)
    best_window: str | None = Field(default=None, max_length=120)
    smoke_risk: str | None = Field(default=None, max_length=40)


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
    return {
        "status": "ok",
        "data_mode": "demo",
        "data_freshness": {
            "last_updated": None,
            "age_minutes": None,
            "note": "Live source timestamps are not connected.",
        },
    }


@app.get("/api/aqi-grid")
def aqi_grid() -> dict[str, object]:
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


@app.get("/api/fires")
def fires() -> dict[str, object]:
    generated_at = now_ist()
    return {
        **response_meta(),
        "fires": [
            {**fire, "acq_time": (generated_at - timedelta(hours=2)).isoformat()}
            for fire in FIRE_POINTS
        ],
        "smoke_risk": {
            "fire_count": len(FIRE_POINTS),
            "hours_to_arrival": 9,
            "confidence": "low",
            "level": "elevated",
            "note": (
                "Illustrative likelihood only; this demo does not calculate "
                "smoke transport or verify active fires."
            ),
        },
    }


@app.get("/api/wind")
def wind() -> dict[str, object]:
    return {
        **response_meta(),
        "direction_convention": "degrees the wind blows FROM; 0 is north",
        "vectors": WIND_POINTS,
    }


@app.post("/api/routes")
def routes(request: RouteRequest) -> dict[str, object]:
    start = request.origin
    end = request.destination
    direct_distance = haversine_km(start.lat, start.lon, end.lat, end.lon)
    if direct_distance < 0.1:
        raise HTTPException(
            status_code=422,
            detail="Origin and destination must be at least 100 metres apart.",
        )

    d_lat = end.lat - start.lat
    d_lon = end.lon - start.lon
    length = math.hypot(d_lat, d_lon) or 1.0
    perpendicular = (-d_lon / length, d_lat / length)
    mode_speed = {"walk": 4.5, "run": 8.0, "bike": 16.0, "commute": 24.0}[
        request.mode
    ]
    route_options = []
    for index, offset in enumerate((0.0, 0.035), start=1):
        middle_lat = (start.lat + end.lat) / 2 + perpendicular[0] * offset
        middle_lon = (start.lon + end.lon) / 2 + perpendicular[1] * offset
        coordinates = [
            [start.lon, start.lat],
            [middle_lon, middle_lat],
            [end.lon, end.lat],
        ]
        segment_distances = [
            haversine_km(*reversed(coordinates[i]), *reversed(coordinates[i + 1]))
            for i in range(len(coordinates) - 1)
        ]
        distance_km = sum(segment_distances)
        duration_min = distance_km / mode_speed * 60
        sampled = [
            (start.lat, start.lon),
            (middle_lat, middle_lon),
            (end.lat, end.lon),
        ]
        values = [pm25_at(lat, lon) for lat, lon in sampled]
        if any(value[1] == 0 for value in values):
            raise HTTPException(
                status_code=503,
                detail="No reliable PM2.5 estimate is available along this route.",
            )
        avg_pm25 = sum(value[0] for value in values) / len(values)
        confidence = min(value[1] for value in values)
        cigarettes = avg_pm25 / 22 * (duration_min / 60)
        route_options.append(
            {
                "id": f"demo-route-{index}",
                "label": f"Illustrative route {index}",
                "via": "Approximate straight-line corridor",
                "duration_min": round(duration_min, 1),
                "distance_km": round(distance_km, 1),
                "avg_pm25": round(avg_pm25, 1),
                "cigarettes": round(cigarettes, 2),
                "confidence": round(confidence, 2),
                "rank": 0,
                "recommended": False,
                "geometry": {"type": "LineString", "coordinates": coordinates},
            }
        )
    route_options.sort(key=lambda route: route["cigarettes"])
    for rank, route in enumerate(route_options, start=1):
        route["rank"] = rank
        route["recommended"] = rank == 1

    chosen = route_options[0]
    return {
        **response_meta(),
        "origin": start.model_dump(),
        "destination": end.model_dump(),
        "mode": request.mode,
        "routes": route_options,
        "recommendation": (
            f"{chosen['label']} has the lower illustrative exposure estimate "
            f"({chosen['cigarettes']} cigarette-equivalents)."
        ),
        "exposure_note": (
            "Illustration only: cigarette-equivalents = average PM2.5 × "
            "travel hours / 22. Route geometry and route-level concentrations "
            "are approximate, not navigable or measured. Confidence decreases "
            "with distance from sample monitoring locations."
        ),
    }


@app.post("/api/safe-window")
def safe_window(request: SafeWindowRequest) -> dict[str, object]:
    location = request.location
    profile = request.profile
    current = now_ist().replace(minute=0)
    base_pm25, confidence, nearest_distance = pm25_at(location.lat, location.lon)
    if confidence == 0:
        raise HTTPException(
            status_code=503,
            detail="No reliable PM2.5 estimate is available near this location.",
        )
    hourly = []
    multiplier = ACTIVITY_MULTIPLIERS[profile.activity]
    for index in range(48):
        timestamp = current + timedelta(hours=index)
        hour = timestamp.hour
        diurnal = 1.0 + 0.16 * math.cos((hour - 3) * math.pi / 12)
        predicted = max(0.0, base_pm25 * diurnal)
        exposure_score = min(
            100.0,
            round(predicted / PROFILE_THRESHOLDS[profile.type] * 50 * multiplier),
        )
        risk_level = (
            "low"
            if exposure_score < 25
            else "moderate"
            if exposure_score < 50
            else "high"
            if exposure_score < 75
            else "very_high"
        )
        hourly.append(
            {
                "time": timestamp.isoformat(),
                "pm25_pred": round(predicted, 1),
                "risk_level": risk_level,
                "risk_score": exposure_score,
                "confidence": round(confidence * 0.6, 2),
            }
        )
    window_candidates = [
        (sum(row["pm25_pred"] for row in hourly[i : i + 3]) / 3, i)
        for i in range(len(hourly) - 2)
    ]
    mean_pm25, start_index = min(window_candidates)
    window_start = datetime.fromisoformat(hourly[start_index]["time"])
    window_end = window_start + timedelta(hours=3)
    reason = (
        f"Lowest estimated three-hour PM2.5 period in this illustrative "
        f"forecast for a {PROFILE_NAMES[profile.type]} planning to "
        f"{profile.activity}. "
    )
    if nearest_distance > 15:
        reason += "Nearby monitoring coverage is limited, so confidence is low."
    return {
        **response_meta(),
        "is_estimate": True,
        "method": "illustrative diurnal rule; live weather forecast not connected",
        "location": location.model_dump(),
        "profile": profile.model_dump(),
        "hourly": hourly,
        "best_window": {
            "start": window_start.isoformat(),
            "end": window_end.isoformat(),
            "mean_pm25": round(mean_pm25, 1),
            "reason": reason,
        },
    }


@app.post("/api/advice")
def advice(request: AdviceRequest) -> dict[str, object]:
    profile_name = PROFILE_NAMES[request.profile.type]
    detail_parts = []
    if request.pm25 is not None:
        detail_parts.append(f"The supplied PM2.5 estimate is {request.pm25:g} µg/m³.")
    if request.cigarettes is not None:
        detail_parts.append(
            f"The supplied route estimate is {request.cigarettes:g} "
            "cigarette-equivalents."
        )
    if request.best_window:
        detail_parts.append(f"The supplied lower-exposure window is {request.best_window}.")
    if request.smoke_risk:
        detail_parts.append(f"The supplied smoke-risk level is {request.smoke_risk}.")
    if not detail_parts:
        detail_parts.append("No computed air-quality values were supplied.")

    actions_by_profile = {
        "adult": ["Consider reducing prolonged strenuous outdoor activity when pollution is elevated."],
        "child": ["Consider shorter outdoor periods and indoor alternatives when pollution is elevated."],
        "elderly": ["Consider avoiding prolonged strenuous outdoor activity when pollution is elevated."],
        "asthma": ["Follow your clinician-provided asthma action plan; seek medical advice for symptoms."],
        "outdoor_worker": ["Consider practical exposure-reduction measures and indoor breaks where feasible."],
    }
    return {
        **response_meta(),
        "generated_by": "template",
        "headline": f"Air-quality planning for a {profile_name}",
        "details": " ".join(detail_parts) + " Estimates are illustrative and are not medical advice.",
        "actions": actions_by_profile[request.profile.type],
    }
