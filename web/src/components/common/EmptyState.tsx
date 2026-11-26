"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

// Friendly empty / missing-data state.
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  message = "Try another view or check back after the next refresh.",
  action,
}: EmptyStateProps) {
  return (
    <div className="dbb-empty">
      <div className="dbb-empty-icon">
        <Icon size={22} />
      </div>
      <div className="dbb-empty-title">{title}</div>
      <div className="dbb-empty-text">{message}</div>
      {action}
    </div>
  );
}
