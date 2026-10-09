import type { ApiMeta } from "./air-quality";

export interface RoutePlace {
  name: string;
  lat: number;
  lon: number;
}

export interface RouteOption {
  id: string;
  label: string;
  via: string;
  duration_min: number;
  distance_km: number;
  avg_pm25: number;
  cigarettes: number;
  confidence: number;
  rank: number;
  recommended: boolean;
  geometry: {
    type: "LineString";
    /** [lon, lat] pairs (GeoJSON order) */
    coordinates: [number, number][];
  };
}

export interface RoutesResponse extends ApiMeta {
  origin: RoutePlace;
  destination: RoutePlace;
  mode: string;
  routes: RouteOption[];
  recommendation: string;
  exposure_note: string;
}
