"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  data_mode: string;
  data_freshness: {
    last_updated: string | null;
    age_minutes: number | null;
    note?: string;
  };
};

type HealthState =
  | { loading: true }
  | { loading: false; data: HealthResponse }
  | { loading: false; error: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export default function ApiStatusPage() {
  const [health, setHealth] = useState<HealthState>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health check failed (${response.status}).`);
        }
        return (await response.json()) as HealthResponse;
      })
      .then((data) => setHealth({ loading: false, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setHealth({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "The engine health check failed.",
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <h1>API Status</h1>
      <p>Frontend data mode: {IS_MOCK_MODE ? "Mock JSON" : "Engine API"}</p>
      {health.loading === true ? (
        <p>Checking engine health...</p>
      ) : "error" in health ? (
        <p role="status">
          Engine: <strong>Unavailable</strong> — {health.error}
        </p>
      ) : (
        <>
          <p role="status">
            Engine: <strong>{health.data.status}</strong> (
            {health.data.data_mode} mode)
          </p>
          <p>
            Source data freshness:{" "}
            <strong>
              {health.data.data_freshness.last_updated
                ? `${health.data.data_freshness.age_minutes ?? "Unknown"} minutes`
                : "Not connected"}
            </strong>
          </p>
        </>
      )}
    </main>
  );
}