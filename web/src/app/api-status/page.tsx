"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

import AppShell from "../../components/layout/AppShell";

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

  function runCheck() {
    setHealth({ loading: true });
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
  }

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <AppShell
      pageTitle="API status"
      pageEyebrow="System · Diagnostics"
      headerStatus={
        <span className="dbb-header-chip">
          <Activity size={13} />
          {IS_MOCK_MODE ? "Mock JSON mode" : "Engine API mode"}
        </span>
      }
    >
      <div className="dbb-panel" style={{ maxWidth: 720 }}>
        <div className="dbb-panel-head">
          <div>
            <h2>
              <Activity size={18} />
              Backend health
            </h2>
            <p>
              Frontend data mode:{" "}
              <strong>{IS_MOCK_MODE ? "Mock JSON" : "Engine API"}</strong>. Base
              URL: <code>{API_BASE_URL}</code>.
            </p>
          </div>
          <button
            type="button"
            className="dbb-retry-btn"
            onClick={runCheck}
            disabled={health.loading}
            style={{ opacity: health.loading ? 0.5 : 1 }}
          >
            <RefreshCw size={14} className={health.loading ? "route-spinner" : ""} />
            Re-check
          </button>
        </div>

        {health.loading && (
          <p role="status" style={{ color: "var(--text-secondary)" }}>
            Checking engine health…
          </p>
        )}

        {"error" in health && (
          <div
            className="dbb-error"
            role="alert"
            style={{ marginTop: 12 }}
          >
            <div className="dbb-error-icon">!</div>
            <div className="dbb-error-title">Engine unavailable</div>
            <div className="dbb-error-text">{health.error}</div>
            <button
              type="button"
              className="dbb-retry-btn"
              onClick={runCheck}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {"data" in health && (
          <div className="dbb-col" style={{ gap: 10, marginTop: 8 }}>
            <div className="dbb-row-between">
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                Status
              </span>
              <strong style={{ color: "var(--accent)", fontSize: 13 }}>
                {health.data.status}
              </strong>
            </div>
            <div className="dbb-row-between">
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                Mode
              </span>
              <strong style={{ color: "var(--text)", fontSize: 13 }}>
                {health.data.data_mode}
              </strong>
            </div>
            <div className="dbb-row-between">
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                Last updated
              </span>
              <strong style={{ color: "var(--text)", fontSize: 13 }}>
                {health.data.data_freshness.last_updated
                  ? `${health.data.data_freshness.age_minutes ?? "Unknown"} minutes ago`
                  : "Not connected"}
              </strong>
            </div>
            {health.data.data_freshness.note && (
              <p className="muted-note" style={{ margin: 0 }}>
                {health.data.data_freshness.note}
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
