"""OpenAQ v3 adapter; Python 3.9+. Never logs credentials."""
import copy
import math
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from dotenv import dotenv_values

BASE = "https://api.openaq.org/v3"
TTL = 600
MAX_AGE = 3 * 3600
_lock = threading.Lock()
_cache = None
_fetched = 0
_retry_after = 0
_reason = "not_requested"


class SourceError(Exception):
    pass


def timestamp(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Timestamp needs timezone")
    return parsed.astimezone(timezone.utc)


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Invalid measurement")
    if not math.isfinite(value):
        raise ValueError("Non-finite measurement")
    return float(value)


def load_key():
    # Installed module: engine/app/integrations/openaq_client.py
    env_file = Path(__file__).resolve().parents[2] / ".env"
    values = dotenv_values(env_file, interpolate=False) if env_file.is_file() else {}
    return (os.getenv("OPENAQ_API_KEY") or values.get("OPENAQ_API_KEY") or "").strip()


def request(client, path, params=None):
    try:
        response = client.get(BASE + path, params=params)
        if response.status_code in (401, 403):
            raise SourceError("authentication_failed")
        if response.status_code == 429:
            raise SourceError("rate_limited")
        response.raise_for_status()
        rows = response.json()["results"]
        if not isinstance(rows, list):
            raise ValueError("Invalid results")
        return rows
    except SourceError:
        raise
    except httpx.HTTPError:
        raise SourceError("provider_request_failed") from None
    except (ValueError, KeyError, TypeError):
        raise SourceError("invalid_provider_response") from None


def station_point(client, location, now, index_function):
    """At most one suitable PM2.5 sensor per location."""
    sensors = [s for s in location.get("sensors", [])
               if s.get("parameter", {}).get("id") == 2]
    if not sensors:
        return None
    sensor = sensors[0]
    unit = sensor["parameter"].get("units", "").replace("μ", "µ")
    if unit not in ("µg/m³", "µg/m3", "ug/m3"):
        return None
    end = now.replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(hours=24)
    rows = request(client, "/sensors/{}/hours".format(int(sensor["id"])), {
        "datetime_from": start.isoformat(), "datetime_to": end.isoformat(),
        "limit": 100, "page": 1,
    })
    valid = {}
    for row in rows:
        try:
            if row.get("flagInfo", {}).get("hasFlags"):
                continue
            if row.get("parameter", {}).get("id") != 2:
                continue
            row_unit = row["parameter"].get("units", "").replace("μ", "µ")
            if row_unit not in ("µg/m³", "µg/m3", "ug/m3"):
                continue
            value = number(row["value"])
            if not 0 <= value <= 2000 or value == 999:
                continue
            period = row["period"]
            first = timestamp(period["datetimeFrom"]["utc"])
            last = timestamp(period["datetimeTo"]["utc"])
            if first < start or last > end or (last-first).total_seconds() != 3600:
                continue
            
            coverage = row.get("coverage") or {}
            completeness = coverage.get("percentComplete")
            if completeness is not None and number(completeness) < 75:
                continue
            valid[first] = (last, value)
        except (ValueError, KeyError, TypeError, AttributeError):
            continue
    # A conservative project gate, not a claim of regulatory certification.
    if len(valid) < 18:
        return None
    latest_time, latest_pm25 = max(valid.values())
    if (now-latest_time).total_seconds() > MAX_AGE:
        return None
    coords = location["coordinates"]
    lat, lon = number(coords["latitude"]), number(coords["longitude"])
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    mean = sum(value for _, value in valid.values()) / len(valid)
    index, category = index_function(mean)
    return {
        "id": "openaq-{}".format(location["id"]),
        "name": location.get("name") or "OpenAQ location",
        "lat": lat, "lon": lon, "pm25": round(latest_pm25, 1),
        "pm25_24h_mean": round(mean, 1), "aqi": index, "category": category,
        "aqi_method": "indicative PM2.5-only sub-index; not official overall AQI",
        "confidence": round(len(valid)/24, 3),
        "confidence_note": "Fraction of valid hourly bins, not statistical accuracy.",
        "valid_hours": len(valid), "nearest_station_km": 0.0, "is_estimated": False,
        "last_updated": latest_time.isoformat(),
        "provider": (location.get("provider") or {}).get("name", "OpenAQ provider"),
        "attribution": "OpenAQ and the original data provider",
    }


def fetch_grid(key, index_function):
    now = datetime.now(timezone.utc)
    with httpx.Client(headers={"X-API-Key": key}, timeout=10.0) as client:
        locations = request(client, "/locations", {
            "coordinates": "28.6139,77.2090", "radius": 25000,
            "parameters_id": 2, "limit": 100, "page": 1,
        })
        recent = []
        for location in locations:
            try:
                last = timestamp(location["datetimeLast"]["utc"])
                age = (now-last).total_seconds()
                if -300 <= age <= MAX_AGE and not location.get("isMobile", False):
                    recent.append((last, location))
            except (KeyError, TypeError, ValueError):
                continue
        recent.sort(key=lambda pair: pair[0], reverse=True)
        selected = [loc for _, loc in recent[:8]]
        if not selected:
            raise SourceError("no_recent_delhi_locations")
        def collect(location):
            try:
                return station_point(client, location, now, index_function), None
            except SourceError as error:
                return None, str(error)
            except (ValueError, KeyError, TypeError):
                return None, "invalid_station_data"
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(collect, selected))
    points = [point for point, _ in results if point is not None]
    if not points:
        errors = [error for _, error in results if error]
        raise SourceError(errors[0] if errors else "insufficient_recent_hourly_coverage")
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_demo": False, "source": "OpenAQ v3",
        "note": "Measured hourly PM2.5; calculated PM2.5-only index estimate from "
                "available hours in the past 24h (minimum 18). Not official overall AQI. "
                "Confidence represents hourly coverage only.",
        "aqi_method": "PM2.5-only index estimate",
        "attribution": "OpenAQ and original providers listed per point",
        "points": points, "locations_checked": len(selected),
        "search_note": "Up to 8 recently reporting locations within 25 km of central Delhi.",
    }


def cached(stale=False):
    if _cache is None:
        return None
    result = copy.deepcopy(_cache)
    now = datetime.now(timezone.utc)
    result["points"] = [
        point for point in result["points"]
        if 0 <= (now-timestamp(point["last_updated"])).total_seconds() <= MAX_AGE
    ]
    if not result["points"]:
        return None
    oldest = min(timestamp(point["last_updated"]) for point in result["points"])
    result["data_freshness"] = {
        "last_updated": oldest.isoformat(),
        "age_minutes": int((now-oldest).total_seconds()/60),
    }
    result["is_stale"] = stale
    result["cache_status"] = "stale" if stale else "fresh"
    if stale:
        result["note"] += " Latest provider refresh failed; cached readings shown."
        result["fallback_reason"] = _reason
    return result


def health_status():
    with _lock:
        data = cached(stale=_reason != "ok")
        return {
            "data_mode": "measured_pm25" if data else "demo",
            "provider_status": _reason,
            "data_freshness": data["data_freshness"] if data else {
                "last_updated": None, "age_minutes": None,
            },
            "note": "AQI status only. Wind has a separate provider; fires and forecasts remain demo.",
        }


def get_aqi_payload(demo_factory, index_function):
    global _cache, _fetched, _retry_after, _reason
    with _lock:
        now = time.monotonic()
        fresh = cached()
        if fresh and now-_fetched < TTL:
            return fresh
        if now >= _retry_after:
            key = load_key()
            try:
                if not key:
                    raise SourceError("missing_api_key")
                _cache = fetch_grid(key, index_function)
                _fetched = time.monotonic()
                _reason = "ok"
                _retry_after = 0
                return cached()
            except SourceError as error:
                _reason = str(error)
                _retry_after = time.monotonic() + (600 if _reason == "rate_limited" else 60)
            except (ValueError, KeyError, TypeError, AttributeError, OverflowError):
                _reason = "invalid_provider_response"
                _retry_after = time.monotonic() + 60
        previous = cached(stale=True)
        if previous:
            return previous
        demo = demo_factory()
        demo.update({
            "is_demo": True, "source": "illustrative demo fixture",
            "cache_status": "demo_fallback", "fallback_reason": _reason,
            "data_freshness": {"last_updated": None, "age_minutes": None},
            "note": "No usable current OpenAQ data. Fictional demo readings are shown. Reason: " + _reason,
        })
        return demo
