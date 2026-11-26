"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  inline?: boolean;
}

// Beautiful loading state. Uses the spinning Loader2 from lucide-react.
// Animation respects prefers-reduced-motion via globals.css (transitions set to ~0).
export default function LoadingState({
  label = "Loading…",
  inline = false,
}: LoadingStateProps) {
  if (inline) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 12 }}>
        <Loader2 size={14} className="route-spinner" />
        {label}
      </span>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        gap: 10,
        padding: "36px 20px",
        color: "var(--text-secondary)",
        textAlign: "center",
      }}
      role="status"
    >
      <Loader2 size={28} className="route-spinner" style={{ color: "var(--accent)" }} />
      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}
