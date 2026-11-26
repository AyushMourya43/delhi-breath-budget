"use client";

import { useEffect, useState } from "react";
import { Clock3, Wind } from "lucide-react";

import AnimatedNumber from "./AnimatedNumber";
import { aqiCategoryFor, aqiColorFor } from "../../data/demo/dashboard";

interface AQIGaugeProps {
  aqi: number | null;
  pm25: number | null;
  locationName?: string | null;
  measuredAt?: string | null; // human-readable timestamp
  isDemo?: boolean;
}

const MAX_AQI = 500;

// Animated circular AQI indicator.
// - Smooth animated progress (stroke-dashoffset)
// - Dynamic color based on actual pollution category
// - Animated numerical transition (AnimatedNumber)
// - Clear PM2.5 information
// - Last updated timestamp
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

export default function AQIGauge({
  aqi,
  pm25,
  locationName,
  measuredAt,
  isDemo = false,
}: AQIGaugeProps) {
  // Defer the actual value one tick so the stroke animates from 0 -> aqi
  const [animatedAqi, setAnimatedAqi] = useState(0);

  useEffect(() => {
    if (aqi === null || !Number.isFinite(aqi)) {
      setAnimatedAqi(0);
      return;
    }
    const id = window.setTimeout(() => setAnimatedAqi(aqi), 60);
    return () => window.clearTimeout(id);
  }, [aqi]);

  const color = aqi === null ? "#D5CFC0" : aqiColorFor(aqi);
  const category = aqi === null ? null : aqiCategoryFor(aqi);

  const R = 120;
  const CIRC = 2 * Math.PI * R;
  const fraction = Math.max(0, Math.min(1, animatedAqi / MAX_AQI));
  const offset = CIRC * (1 - fraction);

  const measuredLabel = formatTimeIST(measuredAt);

  return (
    <div className="dbb-gauge-wrap">
      <div className="dbb-gauge">
        <svg className="dbb-gauge-svg" viewBox="0 0 260 260">
          <circle className="dbb-gauge-track" cx="130" cy="130" r={R} />
          <circle
            className="dbb-gauge-progress"
            cx="130"
            cy="130"
            r={R}
            stroke={color}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="dbb-gauge-inner">
          <div className="dbb-gauge-label">
            {isDemo ? "DEMO AQI" : "Current AQI"}
          </div>
          <div className="dbb-gauge-value">
            {aqi === null ? "—" : <AnimatedNumber value={aqi} />}
          </div>
          <div className="dbb-gauge-unit">PM2.5 index · 0–500 scale</div>
          {category && (
            <div
              className="dbb-gauge-cat"
              style={{
                color,
                background: `${color}1A`,
                border: `1px solid ${color}44`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              {category}
            </div>
          )}
        </div>
      </div>

      <div className="dbb-gauge-meta">
        <strong>
          {pm25 === null ? "—" : <AnimatedNumber value={pm25} decimals={0} />}{" "}
          <span style={{ color: "var(--text-dim)", fontSize: 11 }}>µg/m³ PM2.5</span>
        </strong>
        {locationName && (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wind size={12} />
            Peak at <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{locationName}</strong>
          </span>
        )}
        {measuredLabel && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-dim)" }}>
            <Clock3 size={12} />
            {measuredLabel}
          </span>
        )}
      </div>
    </div>
  );
}
