"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Demo mode is FRONTEND-ONLY.
// LIVE mode = existing API client (api-client.ts / mock-api.ts) untouched.
// DEMO mode = static sample data from src/data/demo/*.
// The user can toggle from the sidebar; the choice is persisted in localStorage
// so a refresh doesn't silently switch the data source.

type Mode = "live" | "demo";

interface DemoModeContextValue {
  mode: Mode;
  isDemo: boolean;
  setMode: (mode: Mode) => void;
  toggle: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);
const STORAGE_KEY = "dbb-demo-mode";

function readInitialMode(): Mode {
  if (typeof window === "undefined") return "demo";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "live" ? "live" : "demo";
  } catch {
    return "demo";
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("demo");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(readInitialMode());
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      /* ignore quota / privacy errors */
    }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "live" ? "demo" : "live";
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, next);
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<DemoModeContextValue>(
    () => ({ mode, isDemo: hydrated && mode === "demo", setMode, toggle }),
    [mode, hydrated, setMode, toggle],
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    // Safe fallback for components rendered outside the provider (defensive)
    return {
      mode: "demo",
      isDemo: true,
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
