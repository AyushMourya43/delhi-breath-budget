// Single entry point for the demo data layer.
// Re-export every demo dataset + helper so components import from one place.

export * from "./dashboard";
export * from "./pollution";
export * from "./weather";
export * from "./map";
export * from "./routes";
export * from "./assistant";
export * from "./notifications";

export const DEMO_MODE_LABEL = "DEMO";
export const LIVE_MODE_LABEL = "LIVE";
