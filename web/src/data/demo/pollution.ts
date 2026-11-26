// Pollution analytics demo data — hourly, daily, weekly, forecast, location comparison.
// All values illustrative. Labelled DEMO at the UI layer.

export interface HourlyPoint {
  hour: string; // "00".."23"
  pm25: number;
  aqi: number;
}

export interface DailyPoint {
  day: string; // Mon..Sun
  pm25: number;
  aqi: number;
}

export interface ForecastPoint {
  hour: string; // ISO
  pm25_pred: number;
  risk_level: "low" | "moderate" | "high";
}

export interface LocationComparison {
  name: string;
  pm25: number;
  aqi: number;
  category: string;
}

// Realistic Delhi NCR winter pattern — peaks overnight, dips mid-afternoon
export const hourlyDemo: HourlyPoint[] = [
  { hour: "00", pm25: 188, aqi: 358 },
  { hour: "01", pm25: 196, aqi: 364 },
  { hour: "02", pm25: 198, aqi: 366 },
  { hour: "03", pm25: 190, aqi: 360 },
  { hour: "04", pm25: 181, aqi: 352 },
  { hour: "05", pm25: 171, aqi: 344 },
  { hour: "06", pm25: 158, aqi: 332 },
  { hour: "07", pm25: 142, aqi: 318 },
  { hour: "08", pm25: 125, aqi: 305 },
  { hour: "09", pm25: 108, aqi: 290 },
  { hour: "10", pm25: 93,  aqi: 240 },
  { hour: "11", pm25: 79,  aqi: 196 },
  { hour: "12", pm25: 69,  aqi: 168 },
  { hour: "13", pm25: 62,  aqi: 148 },
  { hour: "14", pm25: 60,  aqi: 142 },
  { hour: "15", pm25: 62,  aqi: 148 },
  { hour: "16", pm25: 70,  aqi: 162 },
  { hour: "17", pm25: 77,  aqi: 180 },
  { hour: "18", pm25: 87,  aqi: 200 },
  { hour: "19", pm25: 100, aqi: 230 },
  { hour: "20", pm25: 116, aqi: 268 },
  { hour: "21", pm25: 133, aqi: 305 },
  { hour: "22", pm25: 150, aqi: 328 },
  { hour: "23", pm25: 166, aqi: 345 },
];

export const dailyDemo: DailyPoint[] = [
  { day: "Mon", pm25: 142, aqi: 322 },
  { day: "Tue", pm25: 158, aqi: 338 },
  { day: "Wed", pm25: 171, aqi: 351 },
  { day: "Thu", pm25: 165, aqi: 345 },
  { day: "Fri", pm25: 148, aqi: 328 },
  { day: "Sat", pm25: 132, aqi: 312 },
  { day: "Sun", pm25: 121, aqi: 301 },
];

export interface WeeklyComparison {
  weekLabel: string;
  thisWeek: number;
  lastWeek: number;
}

export const weeklyComparisonDemo: WeeklyComparison[] = [
  { weekLabel: "Mon", thisWeek: 142, lastWeek: 168 },
  { weekLabel: "Tue", thisWeek: 158, lastWeek: 175 },
  { weekLabel: "Wed", thisWeek: 171, lastWeek: 182 },
  { weekLabel: "Thu", thisWeek: 165, lastWeek: 170 },
  { weekLabel: "Fri", thisWeek: 148, lastWeek: 160 },
  { weekLabel: "Sat", thisWeek: 132, lastWeek: 145 },
  { weekLabel: "Sun", thisWeek: 121, lastWeek: 130 },
];

export const forecastDemo: ForecastPoint[] = Array.from({ length: 24 }).map((_, i) => {
  const base = [108, 125, 142, 158, 171, 181, 188, 190, 188, 181, 171, 158,
    142, 125, 108, 93, 79, 69, 62, 60, 62, 70, 77, 87];
  const pm25 = base[i] ?? 80;
  const risk_level = pm25 >= 150 ? "high" : pm25 >= 90 ? "moderate" : "low";
  const d = new Date();
  d.setHours(d.getHours() + i, 0, 0, 0);
  return { hour: d.toISOString(), pm25_pred: pm25, risk_level };
});

export const locationComparisonDemo: LocationComparison[] = [
  { name: "Anand Vihar",     pm25: 214, aqi: 373, category: "Very Poor" },
  { name: "Narela",          pm25: 189, aqi: 354, category: "Very Poor" },
  { name: "Rohini",          pm25: 176, aqi: 344, category: "Very Poor" },
  { name: "Noida Sector 62", pm25: 171, aqi: 340, category: "Very Poor" },
  { name: "Punjabi Bagh",    pm25: 163, aqi: 334, category: "Very Poor" },
  { name: "Okhla",           pm25: 158, aqi: 330, category: "Very Poor" },
  { name: "ITO",             pm25: 148, aqi: 322, category: "Very Poor" },
  { name: "Connaught Place", pm25: 139, aqi: 315, category: "Very Poor" },
  { name: "Dwarka",          pm25: 132, aqi: 310, category: "Very Poor" },
  { name: "RK Puram",        pm25: 121, aqi: 302, category: "Very Poor" },
  { name: "Gurugram",        pm25: 104, aqi: 247, category: "Poor" },
  { name: "Najafgarh",       pm25: 96,  aqi: 221, category: "Poor" },
];
