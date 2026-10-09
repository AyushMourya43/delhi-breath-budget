import type { ApiMeta } from "./air-quality";

export interface Fire {
  id: string;
  lat: number;
  lon: number;
  frp: number;
  confidence: string;
  acq_time: string;
}

export interface SmokeRisk {
  fire_count: number;
  hours_to_arrival: number;
  confidence: string;
  level: string;
  note: string;
}

export interface FiresResponse extends ApiMeta {
  fires: Fire[];
  smoke_risk: SmokeRisk;
}
