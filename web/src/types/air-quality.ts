export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export interface ApiMeta {
  generated_at: string;
  is_demo: boolean;
  source: string;
  note?: string;
}

export interface AQIPoint {
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
}

export interface AQIGridResponse extends ApiMeta {
  data_freshness: { last_updated: string | null; age_minutes: number | null };
  points: AQIPoint[];
}
