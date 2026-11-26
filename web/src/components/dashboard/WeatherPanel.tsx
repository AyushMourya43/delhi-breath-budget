"use client";

import { Droplets, Eye, Gauge, Sunrise, Sunset, Thermometer, Wind } from "lucide-react";

import { weatherDemo } from "../../data/demo/weather";
import AnimatedNumber from "./AnimatedNumber";
import { degreesToCompass } from "../../data/demo/dashboard";

interface WeatherPanelProps {
  // Optional live values; if omitted, falls back to demo data (clearly labelled)
  tempC?: number | null;
  humidity?: number | null;
  windSpeedKmh?: number | null;
  windDirectionDeg?: number | null;
  isDemo?: boolean;
}

// Weather & wind visualization panel.
// - Temperature, humidity, visibility, pressure
// - Animated wind-direction compass
// - Sunrise / sunset line
// Uses live data when provided, demo data otherwise.
export default function WeatherPanel({
  tempC,
  humidity,
  windSpeedKmh,
  windDirectionDeg,
  isDemo = false,
}: WeatherPanelProps) {
  const t = tempC ?? weatherDemo.tempC;
  const h = humidity ?? weatherDemo.humidity;
  const w = windSpeedKmh ?? weatherDemo.windSpeedKmh;
  const dir = windDirectionDeg ?? weatherDemo.windDirectionDeg;

  // Arrow points the way the wind blows TOWARD; data gives direction FROM.
  const arrowRotation = (dir + 180) % 360;
  const compassLabel = degreesToCompass(dir);

  return (
    <div className="dbb-panel" aria-label="Weather and wind">
      <div className="dbb-panel-head">
        <div>
          <h2>
            <Wind size={18} />
            Weather & wind
          </h2>
          <p>
            {isDemo
              ? "Demo conditions — Open-Meteo style sample values."
              : "Open-Meteo · conditions at central Delhi."}
          </p>
        </div>
        {isDemo && <span className="dbb-demo-badge">DEMO</span>}
      </div>

      <div className="dbb-weather">
        <div className="dbb-weather-cell">
          <div className="dbb-weather-cell-label">
            <Thermometer size={13} /> Temperature
          </div>
          <div className="dbb-weather-cell-value">
            <AnimatedNumber value={t} decimals={0} />
            <small> °C</small>
          </div>
          <div className="dbb-weather-cell-extra">Feels like {weatherDemo.feelsLikeC}°C</div>
        </div>

        <div className="dbb-weather-cell">
          <div className="dbb-weather-cell-label">
            <Droplets size={13} /> Humidity
          </div>
          <div className="dbb-weather-cell-value">
            <AnimatedNumber value={h} decimals={0} />
            <small> %</small>
          </div>
          <div className="dbb-weather-cell-extra">Dew point ~ {Math.round(t - (100 - h) / 5)}°C</div>
        </div>

        <div className="dbb-weather-cell" style={{ gridColumn: "span 1" }}>
          <div className="dbb-weather-cell-label">
            <Wind size={13} /> Wind speed
          </div>
          <div className="dbb-weather-cell-value">
            <AnimatedNumber value={w} decimals={0} />
            <small> km/h</small>
          </div>
          <div className="dbb-weather-cell-extra">From {compassLabel} ({Math.round(dir)}°)</div>
        </div>

        <div className="dbb-weather-cell" style={{ alignItems: "center" }}>
          <div className="dbb-weather-cell-label" style={{ alignSelf: "flex-start" }}>
            <Gauge size={13} /> Direction
          </div>
          <div className="dbb-compass" aria-hidden="true">
            <div className="dbb-compass-rose">
              <span className="n">N</span>
              <span className="e">E</span>
              <span className="s">S</span>
              <span className="w">W</span>
            </div>
            <div
              className="dbb-compass-arrow"
              style={{ transform: `rotate(${arrowRotation}deg)` }}
            />
          </div>
          <div className="dbb-weather-cell-extra" style={{ marginTop: 4 }}>
            Blowing toward {degreesToCompass(arrowRotation)}
          </div>
        </div>

        <div className="dbb-weather-cell">
          <div className="dbb-weather-cell-label">
            <Eye size={13} /> Visibility
          </div>
          <div className="dbb-weather-cell-value">
            <AnimatedNumber value={weatherDemo.visibilityKm} decimals={1} />
            <small> km</small>
          </div>
          <div className="dbb-weather-cell-extra">Reduced by smoke &amp; haze</div>
        </div>

        <div className="dbb-weather-cell">
          <div className="dbb-weather-cell-label">
            <Sunrise size={13} /> Sun
          </div>
          <div className="dbb-weather-cell-value" style={{ fontSize: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sunrise size={14} style={{ color: "var(--accent)" }} />
              {weatherDemo.sunrise}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Sunset size={14} style={{ color: "var(--accent)" }} />
              {weatherDemo.sunset}
            </span>
          </div>
          <div className="dbb-weather-cell-extra">UV index {weatherDemo.uvIndex}</div>
        </div>
      </div>
    </div>
  );
}
