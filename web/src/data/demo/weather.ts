// Weather & wind demo data — Delhi NCR style winter morning.
// All values illustrative. Labelled DEMO at the UI layer.

export interface HourlyWeather {
  hour: string; // "00".."23"
  tempC: number;
  humidity: number;
  windKmh: number;
  windDirDeg: number;
  condition: "clear" | "hazy" | "smoke" | "fog";
}

export const weatherDemo = {
  tempC: 22,
  feelsLikeC: 21,
  humidity: 64,
  windSpeedKmh: 9,
  windGustKmh: 14,
  windDirectionDeg: 305,
  windDirectionLabel: "NW",
  pressureHpa: 1014,
  visibilityKm: 1.8,
  uvIndex: 2,
  condition: "smoke" as const,
  sunrise: "06:48",
  sunset: "17:22",
  isDemo: true as const,
};

export const hourlyWeatherDemo: HourlyWeather[] = [
  { hour: "00", tempC: 18, humidity: 72, windKmh: 7,  windDirDeg: 312, condition: "smoke" },
  { hour: "03", tempC: 17, humidity: 75, windKmh: 6,  windDirDeg: 308, condition: "fog" },
  { hour: "06", tempC: 17, humidity: 78, windKmh: 5,  windDirDeg: 305, condition: "fog" },
  { hour: "09", tempC: 20, humidity: 70, windKmh: 8,  windDirDeg: 300, condition: "hazy" },
  { hour: "12", tempC: 24, humidity: 58, windKmh: 11, windDirDeg: 298, condition: "hazy" },
  { hour: "15", tempC: 25, humidity: 54, windKmh: 12, windDirDeg: 295, condition: "clear" },
  { hour: "18", tempC: 23, humidity: 60, windKmh: 10, windDirDeg: 302, condition: "smoke" },
  { hour: "21", tempC: 20, humidity: 68, windKmh: 8,  windDirDeg: 310, condition: "smoke" },
];

export function weatherIcon(condition: HourlyWeather["condition"]): string {
  // Single-glyph icons render consistently in dark UI; these are SVG paths drawn by caller.
  return condition;
}
