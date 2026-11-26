// Route planner demo data — sample comparison for animated route cards.
// Clearly labelled DEMO. Not actual measurements.

export interface DemoRouteOption {
  id: number;
  label: string;
  via: string;
  distanceKm: number;
  durationMinutes: number;
  exposureScore: number | null;
  cigarettes: number | null;
  coverage: number; // 0..1
  reason: string | null;
  recommended: boolean;
  geometry: [number, number][]; // [lat, lon]
  isDemo: true;
}

export interface DemoRouteSet {
  originName: string;
  destinationName: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  routes: DemoRouteOption[];
  recommendation: string;
  exposureNote: string;
  isDemo: true;
}

export const routeDemoSet: DemoRouteSet = {
  originName: "Connaught Place, New Delhi",
  destinationName: "Dwarka Sector 21, Delhi",
  origin: { lat: 28.6315, lon: 77.2167 },
  destination: { lat: 28.5527, lon: 77.0587 },
  routes: [
    {
      id: 1,
      label: "Route A",
      via: "Inner residential roads · lowest exposure",
      distanceKm: 16.1,
      durationMinutes: 46,
      exposureScore: 39.6,
      cigarettes: 1.8,
      coverage: 0.92,
      reason: null,
      recommended: true,
      geometry: [
        [28.6315, 77.2167],
        [28.62, 77.19],
        [28.615, 77.14],
        [28.595, 77.10],
        [28.57, 77.07],
        [28.5527, 77.0587],
      ],
      isDemo: true,
    },
    {
      id: 2,
      label: "Route B",
      via: "Ring Road corridor · fastest",
      distanceKm: 14.2,
      durationMinutes: 38,
      exposureScore: 70.4,
      cigarettes: 3.2,
      coverage: 0.88,
      reason: null,
      recommended: false,
      geometry: [
        [28.6315, 77.2167],
        [28.61, 77.20],
        [28.59, 77.17],
        [28.575, 77.13],
        [28.56, 77.09],
        [28.5527, 77.0587],
      ],
      isDemo: true,
    },
    {
      id: 3,
      label: "Route C",
      via: "Outer Ring Road · avoids central congestion",
      distanceKm: 18.5,
      durationMinutes: 52,
      exposureScore: 51.2,
      cigarettes: 2.4,
      coverage: 0.74,
      reason: "Partial coverage — some segments estimated by nearest station.",
      recommended: false,
      geometry: [
        [28.6315, 77.2167],
        [28.66, 77.18],
        [28.68, 77.10],
        [28.62, 77.04],
        [28.57, 77.05],
        [28.5527, 77.0587],
      ],
      isDemo: true,
    },
  ],
  recommendation:
    "Route A takes 8 minutes longer than the fastest option but cuts estimated exposure by 1.4 cigarette-equivalents (44%).",
  exposureNote:
    "Cigarette-equivalent = average PM2.5 / 22 (rule of thumb, not a medical measurement). Route geometry is approximate.",
  isDemo: true,
};
