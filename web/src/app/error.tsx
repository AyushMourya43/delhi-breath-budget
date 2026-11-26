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
        background: "var(--bg, #F5EFE3)",
        color: "var(--text, #1A1A1A)",
        fontFamily: '"Inter", -apple-system, "Segoe UI", system-ui, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: 480,
          padding: 32,
          border: "1px solid rgba(217, 83, 79, 0.25)",
          borderRadius: 16,
          background: "var(--surface, #FFFFFF)",
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
            background: "rgba(217, 83, 79, 0.1)",
            border: "1px solid rgba(217, 83, 79, 0.25)",
            color: "#D9534F",
          }}
        >
          <AlertCircle size={22} />
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
          Something went wrong
        </h2>

        <p style={{ color: "#6B7568", lineHeight: 1.7, fontSize: 13 }}>
          The dashboard encountered an unexpected error.
          Try loading the page again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 18,
            padding: "11px 18px",
            border: "1px solid rgba(62, 124, 79, 0.3)",
            borderRadius: 8,
            background: "rgba(207, 227, 196, 0.58)",
            color: "#2D4A35",
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
