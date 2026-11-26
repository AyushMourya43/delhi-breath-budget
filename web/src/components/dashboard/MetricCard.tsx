"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import AnimatedNumber from "./AnimatedNumber";

export type MetricTone = "accent" | "good" | "moderate" | "poor" | "vpour" | "severe";

interface MetricCardProps {
  label: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  icon: LucideIcon;
  tone?: MetricTone;
  caption?: ReactNode;
  track?: { fraction: number; color?: string };
  ariaBusy?: boolean;
  demo?: boolean;
}

const TONE_CLASS: Record<MetricTone, string> = {
  accent: "teal",
  good: "green",
  moderate: "orange",
  poor: "orange",
  vpour: "red",
  severe: "red",
};

// Modern metric card with subtle borders, small icons, animated value,
// optional progress track. Designed for the 4-up metric-grid.
export default function MetricCard({
  label,
  value,
  unit,
  decimals = 0,
  icon: Icon,
  tone = "accent",
  caption,
  track,
  ariaBusy = false,
  demo = false,
}: MetricCardProps) {
  const toneClass = TONE_CLASS[tone];

  return (
    <article className="metric-card dbb-fade-in" aria-busy={ariaBusy}>
      <div className="metric-heading">
        <span>{label}</span>
        <div className={`metric-icon ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="metric-value">
        {value === null ? "—" : <AnimatedNumber value={value} decimals={decimals} />}
        {unit && value !== null && <small> {unit}</small>}
      </div>

      <div className="metric-bottom">
        {caption ?? <span>&nbsp;</span>}
        {demo && <span className="dbb-demo-badge">DEMO</span>}
      </div>

      {track && (
        <div
          className="metric-track"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(track.fraction * 100)}
        >
          <span
            style={{
              width: `${Math.min(100, Math.max(0, track.fraction * 100))}%`,
              background: track.color ?? "var(--accent)",
            }}
          />
        </div>
      )}
    </article>
  );
}
