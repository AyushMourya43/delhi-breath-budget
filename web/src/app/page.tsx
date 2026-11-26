"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  Gauge,
  MapPin,
  ShieldCheck,
  Wind,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import AQIGauge from "../components/dashboard/AQIGauge";
import MetricCard from "../components/dashboard/MetricCard";
import { AnalyticsCharts, LocationComparisonList } from "../components/dashboard/AnalyticsCharts";
import WeatherPanel from "../components/dashboard/WeatherPanel";
import { FirePanel, ForecastPanel } from "../components/live/LivePanels";
import { useAQIGrid } from "../hooks/useAQIGrid";
import { useDemoMode } from "../lib/demo-mode";
import { dashboardDemo } from "../data/demo/dashboard";
import type { AQIGridResponse } from "../types/air-quality";
import type { RouteSummary } from "../components/routes/RouteComparison";

const PollutionMap = dynamic(() => import("../components/map/PollutionMap"), {
  ssr: false,
  loading: () => (
    <div className="dbb-panel" style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
      Loading interactive Delhi map…
    </div>
  ),
});

const RouteComparison = dynamic(
  () => import("../components/routes/RouteComparison"),
  {
    ssr: false,
    loading: () => (
      <div className="dbb-panel" style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
        Loading route planner…
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

function formatTimeIST(iso?: string | null): string | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return (
    new Date(parsed).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " IST"
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState("adult");
  const [activity, setActivity] = useState("commute");
  const demo = useDemoMode();

  const [routeSummary, setRouteSummary] = useState<RouteSummary>({
    status: "idle",
    route: null,
  });

  // Always call the live hook (preserves existing API contract & refresh cadence).
  // When demo.isDemo is true AND live data is unavailable, we surface the demo
  // sample values, clearly labelled.
  const air = useAQIGrid<AQIGridResponse & { is_stale?: boolean }>();

  const livePoints = useMemo(
    () =>
      (air.data?.points ?? []).filter(
        (point) =>
          Number.isFinite(point.pm25) &&
          point.pm25 >= 0 &&
          Number.isFinite(point.aqi) &&
          point.aqi >= 0,
      ),
    [air.data],
  );

  const liveHighest = useMemo(
    () =>
      livePoints.reduce<(typeof livePoints)[number] | null>(
        (best, point) => (!best || point.aqi > best.aqi ? point : best),
        null,
      ),
    [livePoints],
  );

  // Decide whether to fall back to demo sample values
  const liveUsable = livePoints.length > 0 && !air.error;
  const useDemoValues = demo.isDemo && !liveUsable;

  const currentAQI = useDemoValues
    ? dashboardDemo.aqi
    : (liveHighest?.aqi ?? null);
  const currentPM = useDemoValues
    ? dashboardDemo.pm25
    : (livePoints.length
        ? livePoints.reduce((sum, p) => sum + p.pm25, 0) / livePoints.length
        : null);
  const stationsCount = useDemoValues
    ? dashboardDemo.stationCount
    : (air.data ? livePoints.length : 0);
  const peakLocationName = useDemoValues
    ? dashboardDemo.highestLocationName
    : (liveHighest?.name ?? null);
  const measuredAt = useDemoValues
    ? dashboardDemo.lastUpdated
    : (air.data?.data_freshness?.last_updated ?? null);

  const isLiveDemoFlag = air.data?.is_demo === true;
  const isStale = air.data?.is_stale === true;

  const status = air.error
    ? "Update failed"
    : air.loading
      ? "Loading PM2.5…"
      : !livePoints.length
        ? "No usable readings"
        : isLiveDemoFlag
          ? "Demo PM2.5"
          : isStale
            ? "Cached PM2.5 · stale"
            : "Measured PM2.5";

  // Selected route metric card
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

  // Header status chip
  const headerStatus = (
    <span className="dbb-header-chip">
      <span
        className={`dbb-status-dot ${air.error ? "dbb-error" : air.loading ? "dbb-loading" : ""}`}
      />
      {useDemoValues ? "DEMO data" : status}
    </span>
  );

  return (
    <AppShell
      pageTitle="Air quality dashboard"
      pageEyebrow="DELHI · NCR · LIVE"
      headerStatus={headerStatus}
    >
      {/* Welcome / hero row */}
      <section className="welcome-row" id="overview">
        <div>
          <div className="eyebrow">Live · PM2.5 monitoring</div>
          <h1>
            Make room for <span>better air.</span>
          </h1>
          <p>Understand your exposure. Choose your route. Plan your day.</p>
        </div>
        <div className="data-status">
          <span className="status-dot" />
          {useDemoValues ? "DEMO PM2.5" : status}
        </div>
      </section>

      {/* Notice */}
      <div className="notice">
        <Activity size={18} />
        <div>
          <strong>{useDemoValues ? "DEMO sample data" : status}</strong>
          <p>
            {useDemoValues
              ? dashboardDemo.lastUpdated
                ? `Showing static sample readings (last updated label: ${formatTimeIST(dashboardDemo.lastUpdated)}). Switch to LIVE mode in the sidebar to fetch from the backend.`
                : "Showing static sample readings. Switch to LIVE mode in the sidebar to fetch from the backend."
              : (air.data?.note ??
                "Fetching air-quality readings from the backend.")}
            {measuredAt ? ` Oldest location update: ${formatTimeIST(measuredAt)}.` : ""}
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

      {/* Metric grid — AQI gauge + 3 metric cards */}
      <section className="metric-grid" aria-busy={air.loading}>
        {/* AQI gauge card (spans 1 column, taller) */}
        <article className="metric-card dbb-fade-in" style={{ padding: 24, gridColumn: "span 1" }}>
          <div className="metric-heading">
            <span>AQI · air quality index</span>
            <div className="metric-icon teal">
              <Gauge size={18} />
            </div>
          </div>
          <AQIGauge
            aqi={currentAQI}
            pm25={currentPM}
            locationName={peakLocationName}
            measuredAt={measuredAt}
            isDemo={useDemoValues || isLiveDemoFlag}
          />
        </article>

        <MetricCard
          label="Average PM2.5"
          value={currentPM}
          unit="µg/m³"
          decimals={1}
          icon={Wind}
          tone="moderate"
          caption={
            <span>
              {useDemoValues
                ? "Demo · across 12 sample locations"
                : `Across ${livePoints.length} returned locations · ${isLiveDemoFlag ? "demo" : "hourly readings"}`}
            </span>
          }
          track={{
            fraction: currentPM === null ? 0 : Math.min(1, currentPM / 250),
            color: "#E8913C",
          }}
          demo={useDemoValues}
        />

        <MetricCard
          label="Reporting locations"
          value={stationsCount}
          icon={MapPin}
          tone="accent"
          caption={
            <span>
              {air.data
                ? isLiveDemoFlag
                  ? "Demo locations"
                  : "Locations in this response"
                : "Waiting for backend"}
            </span>
          }
          track={{ fraction: stationsCount ? 1 : 0, color: "#7FB069" }}
          demo={useDemoValues}
        />

        <MetricCard
          label="Selected route PM2.5"
          value={routePM}
          unit="µg/m³"
          decimals={1}
          icon={ArrowDownRight}
          tone="good"
          ariaBusy={routeSummary.status === "loading"}
          caption={
            <>
              <a href="#routes" className="positive-label">
                {selectedJourney ? "View or change route" : "Compare routes"}
              </a>
              <span>{routeStatusText}</span>
            </>
          }
          track={{
            fraction: routeCoverage / 100,
            color: "#7FB069",
          }}
        />
      </section>

      {/* Analytics + weather row */}
      <section className="main-grid" style={{ alignItems: "start" }}>
        <div className="dbb-col">
          <AnalyticsCharts isDemo={useDemoValues} />
        </div>
        <aside className="side-column">
          <WeatherPanel
            tempC={useDemoValues ? dashboardDemo.temperatureC : null}
            humidity={useDemoValues ? dashboardDemo.humidity : null}
            windSpeedKmh={useDemoValues ? dashboardDemo.windSpeedKmh : null}
            windDirectionDeg={useDemoValues ? dashboardDemo.windDirectionDeg : null}
            isDemo={useDemoValues}
          />
        </aside>
      </section>

      {/* Location comparison row */}
      <section style={{ marginBottom: 20 }}>
        <LocationComparisonList isDemo={useDemoValues} />
      </section>

      {/* Map + Routes row */}
      <section className="main-grid" style={{ alignItems: "start" }}>
        <div className="dbb-col">
          <div id="map" style={{ scrollMarginTop: 100 }}>
            <PollutionMap />
          </div>
          <div id="routes" style={{ scrollMarginTop: 100 }}>
            <RouteComparison onSummaryChange={setRouteSummary} />
          </div>
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
              Selected activity:{" "}
              <strong>{activity.replace("-", " ")}</strong>
            </div>
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
          Environmental awareness prototype · See each section{"'"}s data source ·
          Not medical advice
        </p>
        <span />
      </footer>
    </AppShell>
  );
}
