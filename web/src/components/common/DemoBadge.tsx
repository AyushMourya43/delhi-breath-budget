"use client";

import { FlaskConical } from "lucide-react";

interface DemoBadgeProps {
  size?: "sm" | "lg";
  label?: string;
  withIcon?: boolean;
}

// Reusable DEMO indicator. Always shown when sample data is being
// rendered so demo values are never silently presented as real measurements.
export default function DemoBadge({
  size = "sm",
  label = "DEMO",
  withIcon = false,
}: DemoBadgeProps) {
  if (size === "lg") {
    return (
      <span className="dbb-demo-pill-lg">
        {withIcon && <FlaskConical size={13} />}
        {label}
      </span>
    );
  }
  return (
    <span className="dbb-demo-badge">
      {withIcon && <FlaskConical size={10} />}
      {label}
    </span>
  );
}
