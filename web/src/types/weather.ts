import type { ApiMeta } from "./air-quality";

export interface WindVector {
  lat: number;
  lon: number;
  speed_kmh: number;
  /** Degrees the wind blows FROM (0 = north, 90 = east) */
  direction_deg: number;
}

export interface WindResponse extends ApiMeta {
  direction_convention: string;
  vectors: WindVector[];
}
