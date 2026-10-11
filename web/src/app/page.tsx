"use client";
import dynamic from "next/dynamic";
import { FirePanel, ForecastPanel } from "../components/live/LivePanels";
import { useState } from "react";
import { useAQIGrid } from "../hooks/useAQIGrid";
import type { AQIGridResponse } from "../types/air-quality";
import {
  Activity,
  ArrowDownRight,
  Gauge,
  MapPin,
  Menu,
  ShieldCheck,
  Wind,
  X,
} from "lucide-react";
const PollutionMap = dynamic(() => import("../components/map/PollutionMap"), {
  ssr: false,
  loading: () => (
    <div className="panel" style={{ padding: 32 }}>
      Loading interactive Delhi map...
    </div>
  ),
});
const RouteComparison = dynamic(
  () => import("../components/routes/RouteComparison"),
  {
    ssr: false,
    loading: () => (
      <div className="panel" style={{ padding: 24 }}>
        Loading route planner...
      </div>
    ),
  },
);
const profiles = [
  { value: "adult", label: "Healthy adult" },
  { value: "child", label: "Child" },
  { value: "asthma", label: "Asthma-sensitive" },
  { value: "elderly", label: "Older adult" },
  { value: "worker", label: "Outdoor worker" },
];
function aqiLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very poor";
  return "Severe";
}
export default function HomePage() {
  const [profile, setProfile] = useState("adult");
  const [activity, setActivity] = useState("commute");
  const [menuOpen, setMenuOpen] = useState(false);
  const air = useAQIGrid<AQIGridResponse & { is_stale?: boolean }>();
  const stations = (air.data?.points ?? []).filter(
    (point) =>
      Number.isFinite(point.pm25) &&
      point.pm25 >= 0 &&
      Number.isFinite(point.aqi) &&
      point.aqi >= 0,
  );
  const highest = stations.reduce<(typeof stations)[number] | null>(
    (best, point) => (!best || point.aqi > best.aqi ? point : best),
    null,
  );
  const currentAQI = highest?.aqi ?? null;
  const averagePM = stations.length
    ? stations.reduce((sum, station) => sum + station.pm25, 0) / stations.length
    : null;
  const isDemo = air.data?.is_demo === true;
  const isStale = air.data?.is_stale === true;
  const status = air.error
    ? "Update failed"
    : air.loading
      ? "Loading PM2.5…"
      : !stations.length
        ? "No usable readings"
        : isDemo
          ? "Demo PM2.5"
          : isStale
            ? "Cached PM2.5 · stale"
            : "Measured PM2.5";
  const indexColor =
    currentAQI === null
      ? "#64748b"
      : currentAQI <= 50
        ? "#16a34a"
        : currentAQI <= 100
          ? "#65a30d"
          : currentAQI <= 200
            ? "#d97706"
            : currentAQI <= 300
              ? "#ef4444"
              : "#991b1b";
  const timestamp = air.data?.data_freshness?.last_updated;
  const measuredAt =
    timestamp && Number.isFinite(Date.parse(timestamp))
      ? new Date(timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) + " IST"
      : null;

  const profileAdvice: Record<string, string> = {
    adult:
      "Consider reducing prolonged outdoor exertion while pollution levels remain elevated.",
    child:
      "Consider shorter outdoor activities and indoor alternatives when pollution is elevated.",
    asthma:
      "Consider following your clinician's asthma action plan and limiting exposure to polluted air.",
    elderly:
      "Consider avoiding prolonged strenuous outdoor activity during elevated pollution.",
    worker:
      "Consider practical exposure-reduction measures and suitable workplace protection.",
  };
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol">
            <Wind size={24} />
          </div>
          <div>
            <div className="brand-name">Delhi Breath Budget</div>
            <div className="brand-subtitle">
              PERSONAL AIR QUALITY INTELLIGENCE
            </div>
          </div>
        </div>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a href="#overview" onClick={() => setMenuOpen(false)}>
            Overview
          </a>
          <a href="#map" onClick={() => setMenuOpen(false)}>
            Pollution map
          </a>
          <a href="#routes" onClick={() => setMenuOpen(false)}>
            Routes
          </a>
          <a href="#forecast" onClick={() => setMenuOpen(false)}>
            Forecast
          </a>
          <a href="/plan-my-day" onClick={() => setMenuOpen(false)}>
            Plan My Day
          </a>
        </nav>
        <div className="header-location">
          <MapPin size={15} />
          <span>Delhi NCR</span>
          <span className="demo-pill">{status}</span>
        </div>
        <button
          className="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      <div className="dashboard" id="overview">
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              LIVE· PM2.5 MONITORING
            </div>
            <h1>
              Make room for <span>better air.</span>
            </h1>
            <p>Understand your exposure. Choose your route. Plan your day.</p>
          </div>
          <div className="data-status">
            <span className="status-dot" />
            {status}
          </div>
        </section>
        <div className="notice">
          <Activity size={18} />
          <div>
            <strong>{status}</strong>
            <p>
              {air.data?.note ??
                "Fetching air-quality readings from the backend."}
              {measuredAt ? ` Oldest location update: ${measuredAt}.` : ""}
              {isStale ? " These cached readings are stale." : ""} Route
              exposure, smoke risk and forecasts remain demonstrations.
            </p>
            {air.error && (
              <p role="alert">
                Could not refresh air-quality data.
                {air.data
                  ? " Showing the last fetched readings; they may be outdated."
                  : " Check that the backend is running on port 8000."}{" "}
                <button type="button" onClick={air.refetch}>
                  Retry
                </button>
              </p>
            )}
          </div>
        </div>
        <section className="metric-grid" aria-busy={air.loading}>
          <article className="metric-card">
            <div className="metric-heading">
              <span>Highest location PM2.5 index</span>
              <div className="metric-icon red">
                <Gauge size={19} />
              </div>
            </div>
            <div className="metric-value">{currentAQI ?? "—"}</div>
            <div className="metric-bottom">
              <span
                className="status-badge"
                style={{ color: indexColor, background: `${indexColor}18` }}
              >
                {currentAQI === null ? "Unavailable" : aqiLabel(currentAQI)}
              </span>
              <span>
                {highest?.name ?? (air.loading ? "Loading…" : "No readings")}
              </span>
            </div>
            <div className="metric-track">
              <span
                style={{
                  width: `${Math.min(100, (currentAQI ?? 0) / 5)}%`,
                  background: indexColor,
                }}
              />
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-heading">
              <span>Average hourly PM2.5</span>
              <div className="metric-icon orange">
                <Wind size={19} />
              </div>
            </div>
            <div className="metric-value">
              {averagePM === null ? "—" : averagePM.toFixed(1)}
              <small> µg/m³</small>
            </div>
            <div className="metric-bottom">
              <span>
                Across {stations.length} returned locations ·{" "}
                {isDemo ? "demo" : "hourly readings"}
              </span>
            </div>
            <div className="metric-track">
              <span
                style={{
                  width: `${Math.min(100, (averagePM ?? 0) / 2.5)}%`,
                  background: "#f97316",
                }}
              />
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-heading">
              <span>Monitoring locations</span>
              <div className="metric-icon teal">
                <MapPin size={19} />
              </div>
            </div>
            <div className="metric-value">
              {air.data ? stations.length : "—"}
            </div>
            <div className="metric-bottom">
              <span>
                {air.data
                  ? isDemo
                    ? "Demo locations"
                    : "Locations in this response; not all Delhi stations"
                  : "Waiting for backend"}
              </span>
            </div>
            <div className="metric-track">
              <span
                style={{
                  width: stations.length ? "100%" : "0%",
                  background: "#0d9488",
                }}
              />
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-heading">
              <span>Route exposure · prototype</span>
              <div className="metric-icon green">
                <ArrowDownRight size={19} />
              </div>
            </div>
            <div className="metric-value">
              —<small> Not connected</small>
            </div>
            <div className="metric-bottom">
              <span className="positive-label">Compare routes below</span>
              <span>Demo exposure only</span>
            </div>
            <div className="metric-track">
              <span style={{ width: "0%", background: "#16a34a" }} />
            </div>
          </article>
        </section>
        <section className="main-grid">
          <div id="map">
            <PollutionMap />
          </div>
          <aside className="side-column">
            <article className="panel profile-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <ShieldCheck size={19} />
                    Personalize guidance
                  </h2>
                  <p>
                    General profile guidance · not based on current readings
                  </p>
                </div>
              </div>
              <label className="field-label" htmlFor="profile">
                Who is this for?
              </label>
              <select
                id="profile"
                value={profile}
                onChange={(event) => setProfile(event.target.value)}
              >
                {profiles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <label className="field-label" htmlFor="activity">
                Planned activity
              </label>
              <select
                id="activity"
                value={activity}
                onChange={(event) => setActivity(event.target.value)}
              >
                <option value="commute">Daily commute</option>
                <option value="walk">Walking</option>
                <option value="run">Running</option>
                <option value="cycle">Cycling</option>
                <option value="work">Outdoor work</option>
              </select>
              <div className="profile-advice">
                <ShieldCheck size={18} />
                <p>{profileAdvice[profile]}</p>
              </div>
              <div className="selected-activity">
                Selected activity: <strong>{activity.replace("-", " ")}</strong>
              </div>
            </article>
            <FirePanel />
          </aside>
        </section>
        <section className="lower-grid">
          <div id="routes">
            <RouteComparison />
          </div>
          <ForecastPanel profile={profile} activity={activity} />
        </section>
        
        <footer className="footer">
          <div className="footer-brand">
            <Wind size={17} />
            Delhi Breath Budget
          </div>
          <p>
            Environmental awareness prototype · See each section’s data source ·
            Not medical advice
          </p>
          <span></span>
        </footer>
      </div>
    </main>
  );
}
