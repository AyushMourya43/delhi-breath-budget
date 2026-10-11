"use client";
import { useEffect, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource";

type Fires = {
  available: boolean;
  is_stale: boolean;
  error?: string;
  note: string;
  fires: unknown[];
  smoke_risk: { level: string; note: string; aligned_count: number };
  data_freshness: { fetched_at: string | null; last_updated: string | null };
};
const time = (s: string | null | undefined) =>
  s
    ? new Date(s).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " IST"
    : "Unavailable";
export function FirePanel() {
  const api = useApiResource<Fires>("/fires", 300000);
  const data = api.data;
  return (
    <article className="panel smoke-panel">
      <div className="panel-heading">
        <div>
          <h2>Satellite fire detections</h2>
          <p>NASA FIRMS · regional past 24 hours</p>
        </div>
        <span className="section-chip">
          {data?.available
            ? data.is_stale
              ? "CACHED"
              : "SATELLITE DATA"
            : "UNAVAILABLE"}
        </span>
      </div>
      {api.loading && <p role="status">Checking fire data…</p>}
      {(api.error || (data && !data.available)) && (
        <p role="alert">
          Fire data unavailable.{" "}
          {data?.error === "missing_api_key"
            ? "Configure FIRMS_MAP_KEY in engine/.env."
            : "The provider may be temporarily unavailable."}{" "}
          <button onClick={api.refetch}>Retry</button>
        </p>
      )}
      {api.error && data && (
        <p>Last fetched response shown; it may be outdated.</p>
      )}
      {data?.available && (
        <>
          <div className="risk-row">
            <div>
              <span className="small-label">
                Thermal detections, not unique fires
              </span>
              <strong>{data.fires.length}</strong>
            </div>
          </div>
          <p>Latest detection: {time(data.data_freshness.last_updated)}</p>
          <p>Last successful fetch: {time(data.data_freshness.fetched_at)}</p>
          <p>
            <strong>
              {data.smoke_risk.level === "potential_transport"
                ? "Potential wind alignment toward Delhi"
                : data.smoke_risk.level === "no_detected_alignment"
                  ? "No alignment detected in checked points"
                  : "Smoke screening unavailable"}
            </strong>
          </p>
          <p className="muted-note">{data.smoke_risk.note}</p>
        </>
      )}
      <p className="muted-note">
        {data?.note} Source: NASA FIRMS / LANCE / Earthdata.
      </p>
    </article>
  );
}
type Forecast = {
  hourly: { time: string; pm25_pred: number }[];
  best_window: {
    start: string;
    end: string;
    mean_pm25: number;
    duration_hours: number;
    reason: string;
  } | null;
  note: string;
  attribution: string;
  data_freshness: { fetched_at: string };
  planning_duration_hours: number;
};
type Advice = { headline: string; details: string; actions: string[] };
async function post<T>(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<T> {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/$/, "");
  const prefix = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";
  const r = await fetch(base + prefix + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Request failed.",
    );
  return data;
}
const locations = [
  { name: "Central Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Anand Vihar", lat: 28.6469, lon: 77.3164 },
  { name: "Rohini", lat: 28.7324, lon: 77.1177 },
  { name: "Dwarka", lat: 28.5921, lon: 77.046 },
  { name: "Lodhi Road", lat: 28.5918, lon: 77.2273 },
];
export function ForecastPanel({
  profile,
  activity,
}: {
  profile: string;
  activity: string;
}) {
  const [location, setLocation] = useState(0),
    [tick, setTick] = useState(0),
    [selected, setSelected] = useState(0);
  const [data, setData] = useState<Forecast | null>(null),
    [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [adviceError, setAdviceError] = useState("");
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let active = true;
    const p = {
      type: profile === "worker" ? "outdoor_worker" : profile,
      activity:
        activity === "cycle" ? "bike" : activity === "work" ? "walk" : activity,
    };
    setLoading(true);
    setError("");
    setData(null);
    setAdvice(null);
    setAdviceError("");
    setSelected(0);
    (async () => {
      try {
        const result = await post<Forecast>(
          "/safe-window",
          { location: locations[location], profile: p },
          controller.signal,
        );
        if (!active) return;
        setData(result);
        try {
          const guidance = await post<Advice>(
            "/advice",
            {
              profile: p,
              pm25:
                result.best_window?.mean_pm25 ?? result.hourly[0]?.pm25_pred,
              best_window: result.best_window
                ? `${time(result.best_window.start)} to ${time(result.best_window.end)}`
                : undefined,
            },
            controller.signal,
          );
          if (active) setAdvice(guidance);
        } catch {
          if (active)
            setAdviceError(
              "Guidance unavailable. Forecast results remain available.",
            );
        }
      } catch (e) {
        if (active)
          setError(
            controller.signal.aborted
              ? "Forecast request timed out. Retry."
              : e instanceof Error
                ? e.message
                : "Forecast unavailable.",
          );
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [profile, activity, location, tick]);
  const row = data?.hourly[selected];
  return (
    <article className="panel" id="forecast">
      <div className="panel-heading">
        <div>
          <h2>Lower-exposure planning</h2>
          <p>Up to 48 future hours · CAMS global model</p>
        </div>
        <span className="section-chip">MODEL ESTIMATE</span>
      </div>
      <label className="field-label" htmlFor="forecast-location">
        Forecast location
      </label>
      <select
        id="forecast-location"
        value={location}
        onChange={(e) => setLocation(Number(e.target.value))}
      >
        {locations.map((l, i) => (
          <option key={l.name} value={i}>
            {l.name}
          </option>
        ))}
      </select>
      <p className="muted-note">
        Profile defaults: adult 2 hours; child, asthma-sensitive and older adult
        1 hour; outdoor worker 3 hours. These are editable product assumptions
        in the backend, not medically safe durations. Activity is passed to
        guidance; it does not change model concentrations.
      </p>
      {loading && <p role="status">Loading forecast and guidance…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => setTick((t) => t + 1)}>Retry</button>
        </p>
      )}
      {data && (
        <>
          <div className="forecast-summary">
            <div>
              <span className="small-label">Lower-exposure period</span>
              <strong>
                {data.best_window
                  ? time(data.best_window.start)
                  : "No complete daylight window"}
              </strong>
              <p>
                {data.best_window
                  ? `Until ${time(data.best_window.end)} · ${data.best_window.mean_pm25} µg/m³ average`
                  : "Try another location."}
              </p>
            </div>
          </div>
          <p>{data.best_window?.reason}</p>
          <label className="field-label" htmlFor="forecast-hour">
            Explore hourly model estimate
          </label>
          <input
            id="forecast-hour"
            style={{ width: "100%" }}
            type="range"
            min={0}
            max={Math.max(0, data.hourly.length - 1)}
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          />
          {row && (
            <p>
              <strong>
                {time(row.time)}: {row.pm25_pred} µg/m³
              </strong>
            </p>
          )}
          <p className="muted-note">{data.note}</p>
          <p className="muted-note">
            Fetched: {time(data.data_freshness.fetched_at)}. Model-run time not
            provided. {data.attribution}.
          </p>
        </>
      )}
      {advice && (
        <div className="profile-advice" style={{ display: "block" }}>
          <strong>{advice.headline}</strong>
          <p>{advice.details}</p>
          <ul>
            {advice.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <small>Template guidance · not medical advice.</small>
        </div>
      )}
      {adviceError && <p>{adviceError}</p>}
    </article>
  );
}
