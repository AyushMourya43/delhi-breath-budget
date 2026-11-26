// Map demo data — Delhi NCR locations with sample coordinates, pollution values,
// timestamps and pollution categories. Clearly identified as DEMO at the UI layer.

import type { AQICategory } from "../../types/air-quality";

export interface DemoMapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  pm25: number;
  aqi: number;
  category: AQICategory;
  confidence: number;
  nearest_station_km: number;
  is_estimated: boolean;
  measuredAt: string; // ISO
  isDemo: true;
}

// Nine named Delhi NCR locations requested by the brief
export const mapDemoPoints: DemoMapPoint[] = [
  { id: "demo-cp",   name: "Connaught Place",  lat: 28.6315, lon: 77.2167, pm25: 139, aqi: 315, category: "Very Poor", confidence: 0.85, nearest_station_km: 1.6, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-av",   name: "Anand Vihar",      lat: 28.6469, lon: 77.3164, pm25: 214, aqi: 373, category: "Very Poor", confidence: 0.90, nearest_station_km: 1.2, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-dw",   name: "Dwarka",           lat: 28.5921, lon: 77.0460, pm25: 132, aqi: 310, category: "Very Poor", confidence: 0.70, nearest_station_km: 3.5, is_estimated: true,  measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-ro",   name: "Rohini",           lat: 28.7324, lon: 77.1177, pm25: 176, aqi: 344, category: "Very Poor", confidence: 0.85, nearest_station_km: 2.0, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-ito",  name: "ITO",              lat: 28.6286, lon: 77.2410, pm25: 148, aqi: 322, category: "Very Poor", confidence: 0.90, nearest_station_km: 1.0, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-pb",   name: "Punjabi Bagh",     lat: 28.6742, lon: 77.1310, pm25: 163, aqi: 334, category: "Very Poor", confidence: 0.80, nearest_station_km: 2.4, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-ig",   name: "India Gate",       lat: 28.6129, lon: 77.2295, pm25: 122, aqi: 300, category: "Very Poor", confidence: 0.78, nearest_station_km: 1.8, is_estimated: true,  measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-no",   name: "Noida",            lat: 28.5355, lon: 77.3910, pm25: 171, aqi: 340, category: "Very Poor", confidence: 0.72, nearest_station_km: 3.0, is_estimated: false, measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
  { id: "demo-gu",   name: "Gurugram",         lat: 28.4595, lon: 77.0266, pm25: 104, aqi: 247, category: "Poor",      confidence: 0.55, nearest_station_km: 6.2, is_estimated: true,  measuredAt: "2026-11-26T09:18:00+05:30", isDemo: true },
];

export interface DemoWindVector {
  lat: number;
  lon: number;
  speed_kmh: number;
  direction_deg: number; // wind blows FROM
}

export const mapDemoWind: DemoWindVector[] = [
  { lat: 28.40, lon: 76.90, speed_kmh: 9,  direction_deg: 305 },
  { lat: 28.40, lon: 77.15, speed_kmh: 8,  direction_deg: 310 },
  { lat: 28.40, lon: 77.40, speed_kmh: 7,  direction_deg: 315 },
  { lat: 28.65, lon: 76.90, speed_kmh: 11, direction_deg: 300 },
  { lat: 28.65, lon: 77.15, speed_kmh: 10, direction_deg: 308 },
  { lat: 28.65, lon: 77.40, speed_kmh: 9,  direction_deg: 312 },
  { lat: 28.90, lon: 76.90, speed_kmh: 13, direction_deg: 298 },
  { lat: 28.90, lon: 77.15, speed_kmh: 12, direction_deg: 303 },
  { lat: 28.90, lon: 77.40, speed_kmh: 11, direction_deg: 306 },
];

export interface DemoFire {
  id: string;
  lat: number;
  lon: number;
  frp: number;
  confidence: "low" | "nominal" | "high";
  acq_time: string;
}

export const mapDemoFires: DemoFire[] = [
  { id: "demo-f1", lat: 31.63, lon: 74.87, frp: 38.4, confidence: "high",    acq_time: "2026-11-26T05:00:00+05:30" },
  { id: "demo-f2", lat: 31.05, lon: 75.60, frp: 22.1, confidence: "nominal", acq_time: "2026-11-26T04:30:00+05:30" },
  { id: "demo-f3", lat: 30.90, lon: 75.85, frp: 45.7, confidence: "high",    acq_time: "2026-11-26T05:00:00+05:30" },
  { id: "demo-f4", lat: 30.34, lon: 76.39, frp: 18.9, confidence: "nominal", acq_time: "2026-11-26T03:30:00+05:30" },
  { id: "demo-f5", lat: 29.80, lon: 76.40, frp: 27.3, confidence: "high",    acq_time: "2026-11-26T04:30:00+05:30" },
];

export const DELHI_CENTER: [number, number] = [28.6139, 77.2090];
