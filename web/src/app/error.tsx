"use client";

import { useEffect } from "react";

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
        padding: "24px",
        background: "#f5f7fb",
        color: "#172238",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "480px",
          padding: "32px",
          border: "1px solid #e5eaf2",
          borderRadius: "16px",
          background: "#ffffff",
        }}
      >
        <h2>Something went wrong</h2>

        <p style={{ color: "#748096", lineHeight: 1.7 }}>
          The dashboard encountered an unexpected error.
          Try loading the page again.
        </p>

        <button
          onClick={() => reset()}
          style={{
            padding: "11px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#0d9488",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}