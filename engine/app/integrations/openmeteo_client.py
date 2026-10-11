"""Current model wind for Delhi/Punjab. Python 3.9 compatible."""
import copy
import math
import threading
import time
from datetime import datetime, timezone

import httpx

URL = "https://api.open-meteo.com/v1/forecast"
POINTS = [(28.6139, 77.209), (29.0, 76.9), (30.0, 76.2), (31.0, 75.5)]
TTL_SECONDS = 300
MAX_AGE_SECONDS = 7200
RETRY_SECONDS = 60
_cache = None
_fetched = 0.0
_retry_after = 0.0
_lock = threading.Lock()


def _number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Provider returned a non-numeric value")
    if not math.isfinite(value):
        raise ValueError("Provider returned a non-finite value")
    return float(value)


def _fetch():
    params = {
        "latitude": ",".join(str(p[0]) for p in POINTS),
        "longitude": ",".join(str(p[1]) for p in POINTS),
        "current": "wind_speed_10m,wind_direction_10m",
        "wind_speed_unit": "kmh",
        "timeformat": "unixtime",
        "timezone": "UTC",
    }
    with httpx.Client(timeout=12.0) as client:
        response = client.get(URL, params=params)
        response.raise_for_status()
        rows = response.json()
    if not isinstance(rows, list) or len(rows) != len(POINTS):
        raise ValueError("Incomplete multi-location wind response")
    vectors, timestamps = [], []
    for row in rows:
        current = row["current"]
        speed = _number(current["wind_speed_10m"])
        direction = _number(current["wind_direction_10m"])
        lat, lon = _number(row["latitude"]), _number(row["longitude"])
        timestamp = _number(current["time"])
        age = time.time() - timestamp
        if not (0 <= speed <= 500 and 0 <= direction <= 360):
            raise ValueError("Invalid wind values")
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("Invalid provider coordinates")
        if age < -900 or age > MAX_AGE_SECONDS:
            raise ValueError("Provider wind timestamp is outside freshness limits")
        units = row["current_units"]
        if units["wind_speed_10m"] != "km/h" or units["wind_direction_10m"] != "°":
            raise ValueError("Unexpected provider wind units")
        timestamps.append(timestamp)
        vectors.append({
            "lat": lat, "lon": lon, "speed_kmh": speed,
            "direction_deg": direction % 360,
            "valid_at": datetime.fromtimestamp(timestamp, timezone.utc).isoformat(),
        })
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_demo": False,
        "source": "Open-Meteo weather model",
        "is_estimate": True,
        "attribution": "Weather data by Open-Meteo.com",
        "note": "Current weather-model estimates, not local sensor observations.",
        "direction_convention": "degrees the wind blows FROM; 0 is north",
        "vectors": vectors,
        "data_freshness": {
            "last_updated": datetime.fromtimestamp(min(timestamps), timezone.utc).isoformat(),
            "age_minutes": 0,
        },
    }


def _cached_result(stale=False):
    if _cache is None:
        return None
    result = copy.deepcopy(_cache)
    updated = datetime.fromisoformat(result["data_freshness"]["last_updated"])
    age = max(0, (datetime.now(timezone.utc) - updated).total_seconds())
    if age > MAX_AGE_SECONDS:
        return None
    result["data_freshness"]["age_minutes"] = int(age / 60)
    result["is_stale"] = stale
    result["cache_status"] = "stale" if stale else "fresh"
    if stale:
        result["note"] += " Provider unavailable; showing last successful response."
    return result


def get_wind_payload(demo_vectors):
    """Use fresh cache, refresh provider, then bounded stale cache or explicit demo."""
    global _cache, _fetched, _retry_after
    with _lock:
        now = time.monotonic()
        if _cache is not None and now - _fetched < TTL_SECONDS:
            cached = _cached_result()
            if cached is not None:
                return cached
        if now >= _retry_after:
            try:
                _cache = _fetch()
                _fetched = time.monotonic()
                _retry_after = 0
                return _cached_result()
            except (httpx.HTTPError, ValueError, KeyError, TypeError, OverflowError):
                _retry_after = time.monotonic() + RETRY_SECONDS
        cached = _cached_result(stale=True)
        if cached is not None:
            return cached
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
            "source": "illustrative demo fixture",
            "is_estimate": True,
            "is_stale": False,
            "cache_status": "demo_fallback",
            "note": "Open-Meteo unavailable or invalid; fictional demo wind is shown.",
            "direction_convention": "degrees the wind blows FROM; 0 is north",
            "vectors": copy.deepcopy(demo_vectors),
            "data_freshness": {"last_updated": None, "age_minutes": None},
        }
