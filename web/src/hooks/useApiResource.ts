"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../lib/api-client";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiResource<T>(path: string, refreshMs?: number) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    // Purana data screen pe rehne do, bas loading flag on karo.
    setState((s) => ({ ...s, loading: true, error: null }));

    apiGet<T>(path, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          data: s.data, // last known value dikhate raho
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      });

    return () => controller.abort();
  }, [path, tick]);

  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(refetch, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, refetch]);

  return { ...state, refetch };
}