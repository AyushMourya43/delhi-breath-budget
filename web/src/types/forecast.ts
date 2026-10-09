import type { ApiMeta } from "./air-quality";

export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export interface HourlyForecast {
  time: string;
  pm25_pred: number;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
}

export interface BestWindow {
  start: string;
  end: string;
  mean_pm25: number;
  reason: string;
}

export interface SafeWindowResponse extends ApiMeta {
  is_estimate: boolean;
  method: string;
  location: { name: string; lat: number; lon: number };
  profile: { type: string; activity: string };
  hourly: HourlyForecast[];
  best_window: BestWindow;
}
