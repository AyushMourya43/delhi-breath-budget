"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

// Friendly error state with retry button.
export default function ErrorState({
  title = "Couldn't load this data",
  message = "The backend may be waking up or temporarily unavailable. Please try again.",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(217, 83, 79, 0.25)",
          background: "rgba(217, 83, 79, 0.06)",
          borderRadius: 12,
          color: "#D9534F",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
        role="alert"
      >
        <AlertCircle size={16} />
        <span style={{ flex: 1 }}>{title}</span>
        {onRetry && (
          <button
            type="button"
            className="dbb-retry-btn"
            style={{ padding: "4px 10px", fontSize: 11 }}
            onClick={onRetry}
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dbb-error" role="alert">
      <div className="dbb-error-icon">
        <AlertCircle size={22} />
      </div>
      <div className="dbb-error-title">{title}</div>
      <div className="dbb-error-text">{message}</div>
      {onRetry && (
        <button type="button" className="dbb-retry-btn" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
