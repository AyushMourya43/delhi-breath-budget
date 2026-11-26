// Delhi Breath Budget — Demo data architecture
// All sample values are clearly illustrative and labelled DEMO at the UI layer.
// Live mode reads from the existing FastAPI backend via src/lib/api-client.ts
// and existing /public/mock/*.json files (preserved, untouched).

import type { AQICategory } from "../../types/air-quality";

export const DEMO_LAST_UPDATED = "2026-11-26T09:18:00+05:30";

export interface DemoDashboardSummary {
  aqi: number;
  pm25: number;
  category: AQICategory;
  temperatureC: number;
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  stationCount: number;
  lastUpdated: string;
  highestLocationName: string;
  isDemo: true;
}

export const dashboardDemo: DemoDashboardSummary = {
  aqi: 373,
  pm25: 214,
  category: "Very Poor",
  temperatureC: 22,
  humidity: 64,
  windSpeedKmh: 9,
  windDirectionDeg: 305,
  windDirectionLabel: "NW",
  stationCount: 12,
  lastUpdated: DEMO_LAST_UPDATED,
  highestLocationName: "Anand Vihar",
  isDemo: true,
};

export function aqiCategoryFor(aqi: number): AQICategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

export function aqiColorFor(aqi: number): string {
  if (aqi <= 50) return "#84CC16";
  if (aqi <= 100) return "#B7F36B";
  if (aqi <= 200) return "#FACC15";
  if (aqi <= 300) return "#F97316";
  if (aqi <= 400) return "#EF4444";
  return "#991B1B";
}

export function degreesToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}
