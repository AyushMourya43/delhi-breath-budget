"use client";

import { useApiResource } from "./useApiResource";

// Abhi type generic hai. Mock JSON ki shape dekh ke isko proper type de denge.
export function useAQIGrid<T = unknown>(refreshMs = 5 * 60 * 1000) {
  return useApiResource<T>("/aqi-grid", refreshMs);
}