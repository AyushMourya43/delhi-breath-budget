"use client";

interface SkeletonProps {
  variant?: "line" | "block" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
}

// Shimmer skeleton loader. Renders N copies of a line/block/card.
// Animation respects prefers-reduced-motion via globals.css.
export default function Skeleton({
  variant = "line",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <>
        {items.map((_, i) => (
          <div key={i} className="dbb-skeleton-card">
            <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "40%" }} />
            <div className="dbb-skeleton dbb-skeleton-block" style={{ marginTop: 12 }} />
            <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "60%", marginTop: 14 }} />
            <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "30%" }} />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className="dbb-skeleton"
          style={{
            width: width ?? (variant === "block" ? "100%" : "100%"),
            height: height ?? (variant === "block" ? 80 : 12),
            marginBottom: variant === "line" ? 8 : 0,
          }}
        />
      ))}
    </>
  );
}

// Convenience: full metric-card skeleton
export function MetricCardSkeleton() {
  return (
    <div className="dbb-skeleton-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "55%" }} />
        <div className="dbb-skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
      </div>
      <div className="dbb-skeleton" style={{ height: 32, marginBottom: 14 }} />
      <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "70%" }} />
      <div className="dbb-skeleton" style={{ height: 4, marginTop: 14, borderRadius: 999 }} />
    </div>
  );
}

// Convenience: chart skeleton
export function ChartSkeleton() {
  return (
    <div className="dbb-chart">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="dbb-skeleton dbb-skeleton-line" style={{ width: "30%" }} />
        <div className="dbb-skeleton" style={{ width: 120, height: 24, borderRadius: 999 }} />
      </div>
      <div className="dbb-skeleton" style={{ height: 220 }} />
    </div>
  );
}
