// UI-state demo data — static examples for loading, empty, error, missing
// measurement, forecast, notifications and map-layer toggles.

export interface DemoNotification {
  id: string;
  level: "info" | "warn" | "error";
  title: string;
  body: string;
  time: string;
}

export const notificationsDemo: DemoNotification[] = [
  {
    id: "n1",
    level: "warn",
    title: "PM2.5 crossied Very Poor threshold",
    body: "Anand Vihar reached AQI 373 in the latest demo refresh. Sensitive groups should avoid prolonged outdoor exertion.",
    time: "09:18 IST",
  },
  {
    id: "n2",
    level: "info",
    title: "Lower-exposure window available",
    body: "Demo forecast suggests 14:00–15:00 IST as the lowest predicted PM2.5 window today.",
    time: "08:42 IST",
  },
  {
    id: "n3",
    level: "error",
    title: "FIRMS satellite feed unavailable",
    body: "Demo fire detections are being shown. Real-time fire screening requires FIRMS_MAP_KEY in engine/.env.",
    time: "07:05 IST",
  },
];

export const uiStateDemo = {
  loadingStates: ["primary", "secondary", "card", "chart"] as const,
  emptyState: {
    title: "No readings in this area",
    body: "Try widening the map view or check back after the next refresh cycle.",
  },
  errorState: {
    title: "Couldn't refresh air-quality data",
    body: "The backend may be waking up or temporarily unavailable. Showing the last fetched readings; they may be outdated.",
  },
  missingMeasurement: {
    title: "Estimated reading",
    body: "Nearest reporting station is more than 5 km away. Value is interpolated, not measured.",
  },
  forecastInfo: {
    title: "Forecast uses CAMS global model",
    body: "Up to 48 future hours. Model-run time is not provided by the source.",
  },
  mapLayerToggles: [
    { id: "heatmap", label: "PM2.5 heatmap", color: "#F97316", enabled: true },
    { id: "stations", label: "Reporting locations", color: "#B7F36B", enabled: true },
    { id: "fires", label: "Fire detections", color: "#EF4444", enabled: true },
    { id: "wind", label: "Wind direction", color: "#9BA59D", enabled: true },
  ],
};
