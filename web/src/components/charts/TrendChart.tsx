"use client";

import { useId, useMemo, useState } from "react";

export interface LinePoint {
  label: string; // x-axis label
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  height?: number;
  color?: string;
  unit?: string;
  decimals?: number;
  isDemo?: boolean;
  ariaLabel?: string;
}

// Lightweight SVG line chart with:
// - Smooth entrance animation (stroke draw)
// - Grid lines + axis labels
// - Interactive hover tooltip
// - Responsive sizing (viewBox + preserveAspectRatio)
// - prefers-reduced-motion respected via CSS (dbb-route-line pattern re-used)
export default function LineChart({
  points,
  height = 220,
  color = "#B7F36B",
  unit = "µg/m³",
  decimals = 0,
  isDemo = false,
  ariaLabel = "Trend chart",
}: LineChartProps) {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 800;
  const H = height;
  const PAD_L = 44;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const { max, min } = useMemo(() => {
    const vals = points.map((p) => p.value);
    if (!vals.length) return { max: 1, min: 0 };
    const rawMax = Math.max(...vals);
    const rawMin = Math.min(...vals);
    const padded = (rawMax - rawMin) * 0.12 || rawMax * 0.12 || 1;
    return { max: rawMax + padded, min: Math.max(0, rawMin - padded) };
  }, [points]);

  const xFor = (i: number) =>
    PAD_L + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yFor = (v: number) =>
    PAD_T + innerH - ((v - min) / (max - min || 1)) * innerH;

  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
      .join(" ");
  }, [points, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  const areaD = useMemo(() => {
    if (!points.length) return "";
    const first = `M ${xFor(0).toFixed(2)} ${(PAD_T + innerH).toFixed(2)}`;
    const line = points
      .map((p, i) => `L ${xFor(i).toFixed(2)} ${yFor(p.value).toFixed(2)}`)
      .join(" ");
    const last = `L ${xFor(points.length - 1).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`;
    return `${first} ${line} ${last}`;
  }, [points, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick ~6 evenly-spaced x labels
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  // Y axis ticks (4)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + (max - min) * t);

  return (
    <div className="dbb-chart" role="img" aria-label={ariaLabel}>
      <div className="dbb-chart-head">
        <div>
          <h3>{ariaLabel}</h3>
          {isDemo && <span className="dbb-demo-badge" style={{ marginTop: 6 }}>DEMO</span>}
        </div>
        {unit && (
          <span className="dbb-chart-legend">
            <span className="dbb-chart-legend-item">
              <span className="dbb-chart-legend-swatch" style={{ background: color }} />
              {unit}
            </span>
          </span>
        )}
      </div>

      <svg
        className="dbb-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, i) => {
          const y = yFor(t);
          return (
            <g key={i}>
              <line
                className="dbb-chart-grid"
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
              />
              <text
                className="dbb-chart-axis-label"
                x={PAD_L - 8}
                y={y + 3}
                textAnchor="end"
              >
                {t.toFixed(decimals)}
              </text>
            </g>
          );
        })}

        {/* X axis */}
        <line
          className="dbb-chart-axis"
          x1={PAD_L}
          x2={W - PAD_R}
          y1={PAD_T + innerH}
          y2={PAD_T + innerH}
        />

        {/* X labels */}
        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text
              key={`x-${i}`}
              className="dbb-chart-axis-label"
              x={xFor(i)}
              y={PAD_T + innerH + 18}
              textAnchor="middle"
            >
              {p.label}
            </text>
          ) : null,
        )}

        {/* Area + line */}
        {points.length > 1 && (
          <>
            <path d={areaD} className="dbb-chart-area" fill={`url(#${gradientId})`} />
            <path
              d={pathD}
              className="dbb-chart-line dbb-route-line"
              stroke={color}
            />
          </>
        )}

        {/* Points */}
        {points.map((p, i) => (
          <g key={`p-${i}`}>
            <rect
              x={xFor(i) - innerW / points.length / 2}
              y={PAD_T}
              width={innerW / points.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
            <circle
              className="dbb-chart-point"
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={hoverIdx === i ? 5 : 3}
              stroke={color}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && points[hoverIdx] && (
        <div
          className="dbb-chart-tooltip dbb-show"
          style={{
            left: `${(xFor(hoverIdx) / W) * 100}%`,
            top: `${(yFor(points[hoverIdx].value) / H) * 100}%`,
          }}
        >
          <div style={{ color: "var(--text-dim)", fontSize: 10 }}>
            {points[hoverIdx].label}
          </div>
          <strong>
            {points[hoverIdx].value.toFixed(decimals)} {unit}
          </strong>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Bar chart (paired weekly comparison etc.)
// ============================================================

interface BarChartProps {
  data: { label: string; values: { name: string; value: number; color: string }[] }[];
  height?: number;
  unit?: string;
  decimals?: number;
  isDemo?: boolean;
  ariaLabel?: string;
}

export function BarChart({
  data,
  height = 220,
  unit = "µg/m³",
  decimals = 0,
  isDemo = false,
  ariaLabel = "Comparison chart",
}: BarChartProps) {
  const W = 800;
  const H = height;
  const PAD_L = 44;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const max = Math.max(
    1,
    ...data.flatMap((d) => d.values.map((v) => v.value)),
  ) * 1.1;

  const groupW = innerW / Math.max(1, data.length);
  const barGap = 4;
  const barW = (groupW - barGap * (data[0]?.values.length ?? 1) - 8) / Math.max(1, data[0]?.values.length ?? 1);

  return (
    <div className="dbb-chart" role="img" aria-label={ariaLabel}>
      <div className="dbb-chart-head">
        <div>
          <h3>{ariaLabel}</h3>
          {isDemo && <span className="dbb-demo-badge" style={{ marginTop: 6 }}>DEMO</span>}
        </div>
        <span className="dbb-chart-legend">
          {data[0]?.values.map((v) => (
            <span className="dbb-chart-legend-item" key={v.name}>
              <span className="dbb-chart-legend-swatch" style={{ background: v.color }} />
              {v.name}
            </span>
          ))}
        </span>
      </div>

      <svg
        className="dbb-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD_T + innerH - t * innerH;
          return (
            <g key={i}>
              <line className="dbb-chart-grid" x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} />
              <text className="dbb-chart-axis-label" x={PAD_L - 8} y={y + 3} textAnchor="end">
                {(t * max).toFixed(decimals)}
              </text>
            </g>
          );
        })}

        {/* X axis */}
        <line className="dbb-chart-axis" x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH} y2={PAD_T + innerH} />

        {/* Bars */}
        {data.map((group, gi) => {
          const groupX = PAD_L + gi * groupW + 4;
          return (
            <g key={gi}>
              {group.values.map((v, vi) => {
                const h = (v.value / max) * innerH;
                const x = groupX + vi * (barW + barGap);
                const y = PAD_T + innerH - h;
                return (
                  <g key={vi}>
                    <rect
                      className="dbb-chart-bar"
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(2, h)}
                      rx={2}
                      fill={v.color}
                    >
                      <title>{`${group.label} · ${v.name}: ${v.value.toFixed(decimals)} ${unit}`}</title>
                    </rect>
                  </g>
                );
              })}
              <text
                className="dbb-chart-axis-label"
                x={groupX + (groupW - 8) / 2}
                y={PAD_T + innerH + 18}
                textAnchor="middle"
              >
                {group.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
