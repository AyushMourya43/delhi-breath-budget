"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ExternalLink,
  Gauge,
  MapPin,
  Menu,
  Send,
  ShieldCheck,
  Wind,
  X,
} from "lucide-react";

import { FirePanel, ForecastPanel } from "../components/live/LivePanels";
import { useAQIGrid } from "../hooks/useAQIGrid";
import type { AQIGridResponse } from "../types/air-quality";
import type { RouteSummary } from "../components/routes/RouteComparison";

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

const telegramCommands = [
  ["/status", "View the latest available pollution summary."],
  ["/window", "View a forecast-based lower-exposure window."],
  ["/profile adult", "Set the bot’s profile to healthy adult."],
  ["/alerts on", "Opt into automatic pollution alerts."],
  ["/alerts off", "Disable automatic alerts."],
  ["/testalert", "Request a labelled delivery test, not a real warning."],
  ["/stop", "Disable alerts."],
];

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

  const [routeSummary, setRouteSummary] = useState<RouteSummary>({
    status: "idle",
    route: null,
  });

  const selectedJourney = routeSummary.route;
  const rawRoutePM = selectedJourney?.exposureScore;

  const routePM =
    typeof rawRoutePM === "number" &&
    Number.isFinite(rawRoutePM) &&
    rawRoutePM >= 0
      ? rawRoutePM
      : null;

  const routeCoverage = selectedJourney
    ? Math.max(
        0,
        Math.min(
          100,
          Number.isFinite(selectedJourney.coverage)
            ? selectedJourney.coverage * 100
            : 0,
        ),
      )
    : 0;

  const routeStatusText =
    routeSummary.status === "loading"
      ? "Calculating…"
      : routeSummary.status === "error"
        ? "Search failed"
        : routeSummary.status === "idle"
          ? "Choose a route"
          : routePM !== null
            ? "Experimental estimate"
            : routeCoverage < 100
              ? "Insufficient coverage"
              : "Estimate unavailable";

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
          <a href="#telegram" onClick={() => setMenuOpen(false)}>
            Telegram
          </a>
        </nav>

        <div className="header-location">
          <MapPin size={15} />
          <span>Delhi NCR</span>
          <span className="demo-pill">{status}</span>
        </div>

        <button
          type="button"
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
              estimates depend on measurement coverage. Forecasts use model
              data; fire wind screening is experimental.
            </p>

            {air.error && (
              <p role="alert">
                Could not refresh air-quality data.
                {air.data
                  ? " Showing the last fetched readings; they may be outdated."
                  : " The backend may be waking up or temporarily unavailable."}{" "}
                <button type="button" onClick={air.refetch}>
                  Retry
                </button>
              </p>
            )}
          </div>
        </div>

        <section className="metric-grid">
          <article className="metric-card" aria-busy={air.loading}>
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
                style={{
                  color: indexColor,
                  background: `${indexColor}18`,
                }}
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

          <article className="metric-card" aria-busy={air.loading}>
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

          <article className="metric-card" aria-busy={air.loading}>
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

          <article
            className="metric-card"
            aria-busy={routeSummary.status === "loading"}
          >
            <div className="metric-heading">
              <span>Selected route PM2.5</span>
              <div className="metric-icon green">
                <ArrowDownRight size={19} />
              </div>
            </div>

            <div aria-live="polite" aria-atomic="true">
              <div className="metric-value">
                {routePM === null ? "—" : routePM.toFixed(1)}
                {routePM !== null && <small> µg/m³</small>}
              </div>

              <p
                style={{
                  margin: "8px 0",
                  fontSize: 13,
                  color: routePM !== null ? "#0f766e" : "#64748b",
                }}
              >
                {routeStatusText}
              </p>

              {selectedJourney && (
                <p
                  style={{
                    margin: "8px 0",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#64748b",
                  }}
                >
                  Route {selectedJourney.id} ·{" "}
                  {selectedJourney.distanceKm.toFixed(1)} km ·{" "}
                  {Math.round(selectedJourney.durationMinutes)} min
                </p>
              )}
            </div>

            <div className="metric-bottom">
              <a href="#routes" className="positive-label">
                {selectedJourney ? "View or change route" : "Compare routes"}
              </a>
              <span>
                {selectedJourney
                  ? `${routeCoverage.toFixed(1)}% sampled time coverage`
                  : "Select your journey below"}
              </span>
            </div>

            <div
              className="metric-track"
              role="progressbar"
              aria-label="Selected route sampled time coverage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={routeCoverage}
            >
              <span
                style={{
                  width: `${routeCoverage}%`,
                  background: "#0d9488",
                }}
              />
            </div>
          </article>
        </section>

        <section className="main-grid" style={{ alignItems: "start" }}>
          {/* Left column: routes follow the map without waiting for sidebar. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              minWidth: 0,
            }}
          >
            <div id="map" style={{ scrollMarginTop: 100 }}>
              <PollutionMap />
            </div>

            <div id="routes" style={{ scrollMarginTop: 100 }}>
              <RouteComparison onSummaryChange={setRouteSummary} />
            </div>
          </div>

          {/* Right column flows independently from the map and routes. */}
          <aside
            className="side-column"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              minWidth: 0,
            }}
          >
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
                Selected activity:{" "}
                <strong>{activity.replace("-", " ")}</strong>
              </div>
            </article>

            <article
              id="telegram"
              className="panel"
              aria-labelledby="telegram-title"
              style={{
                padding: 24,
                scrollMarginTop: 100,
                borderColor: "#bae6fd",
                background: "#f0f9ff",
              }}
            >
              <div className="panel-heading">
                <div>
                  <h2 id="telegram-title">
                    <Send size={19} aria-hidden="true" />
                    Telegram assistant
                  </h2>
                  <p>
                    Pollution summaries and lower-exposure planning in Telegram.
                  </p>
                </div>
              </div>

              <div
                style={{
                  margin: "14px 0",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <strong>Limited demo access</strong>
                <p style={{ margin: "4px 0 0" }}>
                  The bot currently supports one paired Telegram account.
                  Public registration is not available yet. Other visitors can
                  open the chat but may not receive replies.
                </p>
              </div>

              <div
                style={{
                  margin: "16px 0",
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "#475569",
                }}
              >
                <strong>Instructions for the paired demo user</strong>
                <ol
                  style={{
                    paddingLeft: 20,
                    margin: "8px 0",
                    listStyleType: "decimal",
                  }}
                >
                  <li>Click “Open Telegram Bot” below.</li>
                  <li>
                    Use the Telegram account paired with the project team.
                  </li>
                  <li>Send a command from the list below in the bot’s chat.</li>
                </ol>
              </div>

              <div style={{ margin: "16px 0 20px" }}>
                {telegramCommands.map(([command, description]) => (
                  <div
                    key={command}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "max-content minmax(0, 1fr)",
                      gap: 12,
                      marginBottom: 10,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "#475569",
                    }}
                  >
                    <code>{command}</code>
                    <span>{description}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://t.me/QiraBot_bot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open QiraBot in Telegram (opens in a new tab)"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 10,
                  background: "#0369a1",
                  color: "#fff",
                  fontWeight: 600,
                  textDecoration: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Send size={17} aria-hidden="true" />
                Open Telegram Bot
                <ExternalLink size={15} aria-hidden="true" />
              </a>

              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "#64748b",
                  marginTop: 12,
                }}
              >
                Replies and automatic checks require the demo bot to be
                running. Website profile selections are not transferred to
                Telegram. Forecast windows are not guaranteed safe outdoor
                times.
              </p>
            </article>

            <FirePanel />
            <ForecastPanel profile={profile} activity={activity} />
          </aside>
        </section>

        <footer className="footer">
          <div className="footer-brand">
            <Wind size={17} />
            Delhi Breath Budget
          </div>
          <p>
            Environmental awareness prototype · See each section’s data source
            · Not medical advice
          </p>
          <span />
        </footer>
      </div>
    </main>
  );
}