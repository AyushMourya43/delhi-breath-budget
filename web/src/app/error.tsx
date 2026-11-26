"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--bg, #101312)",
        color: "var(--text, #F2F4EF)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 480,
          padding: 32,
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: 16,
          background: "var(--surface, #1B211E)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 16px",
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#EF4444",
          }}
        >
          <AlertCircle size={22} />
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
          Something went wrong
        </h2>

        <p style={{ color: "#9BA59D", lineHeight: 1.7, fontSize: 13 }}>
          The dashboard encountered an unexpected error.
          Try loading the page again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 18,
            padding: "11px 18px",
            border: "1px solid rgba(183, 243, 107, 0.35)",
            borderRadius: 8,
            background: "rgba(183, 243, 107, 0.12)",
            color: "#B7F36B",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </section>
    </main>
  );
}
