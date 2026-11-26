"use client";

import { useState } from "react";

import LineChart, { BarChart } from "../charts/TrendChart";
import {
  hourlyDemo,
  dailyDemo,
  weeklyComparisonDemo,
  forecastDemo,
  locationComparisonDemo,
} from "../../data/demo/pollution";
import { aqiColorFor } from "../../data/demo/dashboard";

type Tab = "hourly" | "daily" | "weekly" | "forecast";

const TABS: { id: Tab; label: string }[] = [
  { id: "hourly", label: "24-hour" },
  { id: "daily", label: "7-day" },
  { id: "weekly", label: "Week vs last" },
  { id: "forecast", label: "Forecast" },
];

interface AnalyticsChartsProps {
  isDemo?: boolean;
}

// Pollution analytics panel with tabbed views:
// - Hourly PM2.5 trend (line chart)
// - Daily pollution trend (line chart)
// - Weekly comparison (paired bar chart)
// - 24-hour forecast visualization (line chart)
// Each chart has smooth entrance animation, interactive tooltip,
// labelled axes, and a DEMO badge when isDemo.
export function AnalyticsCharts({ isDemo = false }: AnalyticsChartsProps) {
  const [tab, setTab] = useState<Tab>("hourly");

  const hourlyPoints = hourlyDemo.map((p) => ({ label: `${p.hour}h`, value: p.pm25 }));
  const dailyPoints = dailyDemo.map((p) => ({ label: p.day, value: p.pm25 }));
  const forecastPoints = forecastDemo.slice(0, 24).map((p, i) => ({
    label: `${i}h`,
    value: p.pm25_pred,
  }));
  const weeklyData = weeklyComparisonDemo.map((w) => ({
    label: w.weekLabel,
    values: [
      { name: "This week", value: w.thisWeek, color: "#B7F36B" },
      { name: "Last week", value: w.lastWeek, color: "#6B7568" },
    ],
  }));

  return (
    <div className="dbb-panel" aria-label="Pollution analytics">
      <div className="dbb-panel-head">
        <div>
          <h2>Pollution analytics</h2>
          <p>
            {isDemo
              ? "Demo PM2.5 trend data for Delhi NCR. Switch to Live for backend readings."
              : "Backend PM2.5 trend data across Delhi NCR reporting locations."}
          </p>
        </div>
        {isDemo && <span className="dbb-demo-badge">DEMO</span>}
      </div>

      <div className="dbb-chart-tabs" role="tablist" aria-label="Analytics view">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`dbb-chart-tab ${tab === t.id ? "dbb-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "hourly" && (
          <LineChart
            points={hourlyPoints}
            ariaLabel="24-hour PM2.5 trend"
            isDemo={isDemo}
            color="#B7F36B"
          />
        )}
        {tab === "daily" && (
          <LineChart
            points={dailyPoints}
            ariaLabel="7-day daily PM2.5 trend"
            isDemo={isDemo}
            color="#FACC15"
          />
        )}
        {tab === "weekly" && (
          <BarChart
            data={weeklyData}
            ariaLabel="This week vs last week PM2.5 comparison"
            isDemo={isDemo}
          />
        )}
        {tab === "forecast" && (
          <LineChart
            points={forecastPoints}
            ariaLabel="24-hour PM2.5 forecast"
            isDemo={isDemo}
            color="#84CC16"
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Location comparison list (separate component for reuse)
// ============================================================

interface LocationComparisonListProps {
  isDemo?: boolean;
}

export function LocationComparisonList({ isDemo = false }: LocationComparisonListProps) {
  const sorted = [...locationComparisonDemo].sort((a, b) => b.pm25 - a.pm25);
  const max = sorted[0]?.pm25 ?? 1;

  return (
    <div className="dbb-panel" aria-label="Location-wise pollution comparison">
      <div className="dbb-panel-head">
        <div>
          <h2>Location comparison</h2>
          <p>PM2.5 readings across {sorted.length} Delhi NCR reporting locations.</p>
        </div>
        {isDemo && <span className="dbb-demo-badge">DEMO</span>}
      </div>

      <div className="dbb-col" style={{ gap: 8 }}>
        {sorted.map((loc) => {
          const color = aqiColorFor(loc.aqi);
          return (
            <div
              key={loc.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(120px, 1fr) 60px 1fr",
                alignItems: "center",
                gap: 12,
                padding: "8px 4px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
                {loc.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {loc.aqi}
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "var(--surface-3)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(loc.pm25 / max) * 100}%`,
                    background: color,
                    borderRadius: 999,
                    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
