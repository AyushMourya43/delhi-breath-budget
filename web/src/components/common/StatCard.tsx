"use client";

import type { ReactNode } from "react";
import { Activity, Gauge, MapPin, Wind } from "lucide-react";

import { dashboardDemo } from "../../data/demo/dashboard";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: "gauge" | "wind" | "pin" | "activity";
  tone?: "accent" | "good" | "moderate" | "poor" | "vpour" | "severe";
  caption?: ReactNode;
  isDemo?: boolean;
}

const ICONS = {
  gauge: Gauge,
  wind: Wind,
  pin: MapPin,
  activity: Activity,
} as const;

// Backwards-compatible StatCard. The dashboard uses MetricCard directly;
// this is kept as a small primitive for ad-hoc inline stats.
export default function StatCard({
  label,
  value,
  icon = "gauge",
  tone = "accent",
  caption,
  isDemo = false,
}: StatCardProps) {
  const Icon = ICONS[icon];
  void dashboardDemo; // demo data is consumed by callers, not here directly

  return (
    <div className="metric-card dbb-fade-in">
      <div className="metric-heading">
        <span>{label}</span>
        <div className={`metric-icon ${tone === "accent" ? "teal" : tone === "good" ? "green" : tone === "vpour" || tone === "severe" ? "red" : "orange"}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        {caption ?? <span>&nbsp;</span>}
        {isDemo && <span className="dbb-demo-badge">DEMO</span>}
      </div>
    </div>
  );
}
