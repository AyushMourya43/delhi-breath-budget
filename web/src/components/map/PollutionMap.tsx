"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { heatLayer } from "@linkurious/leaflet-heat";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { useAQIGrid } from "../../hooks/useAQIGrid";
import { useApiResource } from "../../hooks/useApiResource";
import { useDemoMode } from "../../lib/demo-mode";
import type { AQIGridResponse, AQIPoint } from "../../types/air-quality";
import type { FiresResponse } from "../../types/fire";
import type { WindResponse } from "../../types/weather";
import {
  DELHI_CENTER,
  mapDemoPoints,
  mapDemoWind,
  mapDemoFires,
  type DemoMapPoint,
} from "../../data/demo/map";

const REFRESH_MS = 5 * 60 * 1000;

// Use a keyless raster basemap. CARTO's current endpoint displays an
// API-key-required watermark, while OSM France HOT tiles are blocked in some
// browsers by cross-origin response filtering.
const TILE_URL = "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Tiles by <a href="https://openstreetmap.de/">OpenStreetMap.de</a>';

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#7FB069";
  if (aqi <= 100) return "#C7D64F";
  if (aqi <= 200) return "#E3D24B";
  if (aqi <= 300) return "#E8913C";
  if (aqi <= 400) return "#D9534F";
  return "#8B3A3A";
}

function createStationIcon(aqi: number, label: string) {
  const color = getAqiColor(aqi);
  return L.divIcon({
    className: "dbb-station-icon",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;transform:translateY(-2px);">
        <div style="
          display:flex;align-items:center;justify-content:center;
          min-width:38px;height:30px;padding:0 6px;
          border:2px solid rgba(255,255,255,0.85);
          border-radius:9px;background:${color};
          color:#FFFFFF;font-size:12px;font-weight:700;line-height:1;
          box-shadow:0 2px 8px rgba(30,59,42,0.24);
        ">${aqi}</div>
        <div style="
          width:8px;height:8px;
          border:2px solid rgba(255,255,255,0.85);
          border-radius:50%;background:${color};
          box-shadow:0 0 6px ${color};
        "></div>
        <div style="
          font-size:9px;font-weight:600;color:#1A1A1A;
          text-shadow:0 1px 3px rgba(255,255,255,0.95), 0 0 5px rgba(255,255,255,0.9);
          max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        ">${label}</div>
      </div>
    `,
    iconSize: [44, 50],
    iconAnchor: [22, 46],
    popupAnchor: [0, -42],
  });
}

function createFireIcon() {
  return L.divIcon({
    className: "dbb-fire-icon",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;
        border:2px solid rgba(255,255,255,0.85);
        border-radius:50%;
        background:radial-gradient(circle, #D9534F, #8B3A3A);
        color:white;font-size:14px;font-weight:700;
        box-shadow:0 2px 8px rgba(139,58,58,0.24);
      ">🔥</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function createWindIcon(degrees: number) {
  return L.divIcon({
    className: "dbb-wind-icon",
    html: `
      <div class="wind-arrow-shell">
        <svg
          class="wind-arrow-svg"
          viewBox="0 0 32 32"
          width="27" height="27"
          aria-hidden="true"
          style="transform:rotate(${degrees}deg)"
        >
          <path d="M16 26V6" fill="none" stroke="#3E7C4F" stroke-width="3.5" stroke-linecap="round" />
          <path d="M7.5 14.5L16 6L24.5 14.5" fill="none" stroke="#3E7C4F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function PollutionHeatLayer({
  enabled,
  points,
}: {
  enabled: boolean;
  points: { lat: number; lon: number; aqi: number }[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || points.length === 0) return;

    const heatPoints: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lon,
      Math.max(0.15, Math.min(p.aqi / 400, 1)),
    ]);

    const layer = heatLayer(heatPoints, {
      radius: 62,
      blur: 48,
      minOpacity: 0.25,
      max: 1,
      maxZoom: 12,
      gradient: {
        0.15: "#3E7C4F",
        0.35: "#7FB069",
        0.55: "#E3D24B",
        0.75: "#E8913C",
        1: "#D9534F",
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [enabled, map, points]);

  return null;
}

function RecenterButton() {
  const map = useMap();
  return (
    <button
      type="button"
      className="dbb-recenter-button"
      onClick={() => map.flyTo(DELHI_CENTER, 10, { duration: 0.8 })}
      aria-label="Recenter map on Delhi"
      title="Recenter on Delhi"
    >
      <svg
        viewBox="0 0 24 24"
        width="18" height="18"
        fill="none" stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}

function LayerToggle({
  label,
  color,
  enabled,
  onClick,
}: {
  label: string;
  color: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="dbb-layer-toggle"
      aria-pressed={enabled}
      onClick={onClick}
    >
      <span
        className="dbb-toggle-dot"
        style={{
          background: enabled ? color : "#384238",
          boxShadow: enabled ? `0 0 6px ${color}88` : "none",
        }}
      />
      {label}
      <span aria-hidden="true" style={{ opacity: 0.6 }}>
        {enabled ? "✓" : "+"}
      </span>
    </button>
  );
}

// Adapt a live AQIPoint to the shape the heatmap expects
function toHeatInput(p: AQIPoint) {
  return { lat: p.lat, lon: p.lon, aqi: p.aqi };
}
function demoPointToHeatInput(p: DemoMapPoint) {
  return { lat: p.lat, lon: p.lon, aqi: p.aqi };
}

export default function PollutionMap() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showFires, setShowFires] = useState(true);
  const [showWind, setShowWind] = useState(true);

  const demo = useDemoMode();

  // Always invoke the live hooks (preserves refresh cadence + contracts).
  const aqi = useAQIGrid<AQIGridResponse>();
  const fireData = useApiResource<FiresResponse>("/fires", REFRESH_MS);
  const windData = useApiResource<WindResponse>("/wind", REFRESH_MS);

  // Decide whether to fall back to demo map points.
  // Demo mode + no usable live data → demo points (clearly labelled).
  const livePoints = useMemo(() => aqi.data?.points ?? [], [aqi.data]);
  const liveUsable =
    livePoints.length > 0 && !aqi.error && !aqi.data?.is_demo;
  const useDemoPoints = demo.isDemo && !liveUsable;

  const points = useDemoPoints ? mapDemoPoints : livePoints;
  // Normalize both demo and live fire arrays to a minimal common shape so the
  // rendering code below doesn't have to fight two different confidence types.
  const fires = useDemoPoints
    ? mapDemoFires.map((f) => ({
        id: f.id,
        lat: f.lat,
        lon: f.lon,
        frp: f.frp,
        confidence: String(f.confidence),
        acq_time: f.acq_time,
      }))
    : (fireData.data?.fires ?? []);
  const vectors = useDemoPoints
    ? mapDemoWind
    : windData.data?.vectors ?? [];
  const isDemoFlag = useDemoPoints || aqi.data?.is_demo === true;
  const loadError =
    !useDemoPoints && (aqi.error || fireData.error || windData.error);

  const heatPoints = useMemo(
    () =>
      (useDemoPoints
        ? mapDemoPoints.map(demoPointToHeatInput)
        : livePoints.map(toHeatInput)),
    [useDemoPoints, livePoints],
  );

  return (
    <section className="dbb-map-panel" aria-label="Delhi pollution map">
      <div className="dbb-map-heading">
        <div>
          <h2>Delhi pollution map</h2>
          <p>
            Explore pollution levels, wind direction and fire hotspots across
            Delhi NCR.
          </p>
        </div>
        {isDemoFlag && (
          <div className="dbb-map-status">
            <span className="dbb-map-status-dot" />
            DEMO DATA
          </div>
        )}
      </div>

      {loadError && (
        <div className="dbb-map-error">
          Data error: {loadError}. Showing last known or fallback readings.
        </div>
      )}

      <div className="dbb-layer-controls" aria-label="Map layers">
        <LayerToggle
          label="PM2.5 heatmap"
          color="#E8913C"
          enabled={showHeatmap}
          onClick={() => setShowHeatmap((v) => !v)}
        />
        <LayerToggle
          label="Reporting locations"
          color="#3E7C4F"
          enabled={showStations}
          onClick={() => setShowStations((v) => !v)}
        />
        <LayerToggle
          label="Fire detections"
          color="#D9534F"
          enabled={showFires}
          onClick={() => setShowFires((v) => !v)}
        />
        <LayerToggle
          label="Wind direction"
          color="#9BA59D"
          enabled={showWind}
          onClick={() => setShowWind((v) => !v)}
        />
      </div>

      <div className="dbb-map-wrap">
        <MapContainer
          className="dbb-map"
          center={DELHI_CENTER}
          zoom={10}
          minZoom={7}
          maxZoom={17}
          scrollWheelZoom
          zoomControl
          preferCanvas
        >
          <TileLayer
            attribution={TILE_ATTR}
            url={TILE_URL}
            maxZoom={20}
          />

          <PollutionHeatLayer enabled={showHeatmap} points={heatPoints} />

          {showStations &&
            points.map((p) => {
              return (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lon]}
                  icon={createStationIcon(p.aqi, p.name)}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <strong
                        style={{
                          display: "block",
                          marginBottom: 7,
                          color: "var(--text)",
                          fontSize: 13,
                        }}
                      >
                        {p.name}
                      </strong>
                      <div style={{ marginBottom: 5, color: "var(--text-secondary)" }}>
                        PM2.5 index:{" "}
                        <strong style={{ color: getAqiColor(p.aqi) }}>
                          {p.aqi} · {p.category}
                        </strong>
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        PM2.5: <strong style={{ color: "var(--text)" }}>{p.pm25} µg/m³</strong>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: "var(--text-dim)",
                        }}
                      >
                        {isDemoFlag ? "Demo confidence" : "Hourly coverage"}:{" "}
                        {Math.round(p.confidence * 100)}%
                        {p.is_estimated && " · estimated (nearest station is far)"}
                      </div>
                      {isDemoFlag && (
                        <div
                          style={{
                            marginTop: 8,
                            color: "#3E7C4F",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          ● Illustrative reading — not live data
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {showFires &&
            fires.map((f) => {
              const fid = f.id ?? `fire-${f.lat}-${f.lon}`;
              return (
                <Marker
                  key={fid}
                  position={[f.lat, f.lon]}
                  icon={createFireIcon()}
                >
                  <Popup>
                    <strong>Fire hotspot</strong>
                    <div style={{ marginTop: 5, color: "var(--text-secondary)" }}>
                      FRP: <strong style={{ color: "var(--text)" }}>{f.frp} MW</strong>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Detection confidence:{" "}
                      <strong style={{ color: "var(--text)" }}>{String(f.confidence)}</strong>
                    </div>
                    {(isDemoFlag ||
                      (fireData.data?.is_demo ?? true)) && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#E8913C",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        ● Not a verified active fire
                      </div>
                    )}
                  </Popup>
                </Marker>
              );
            })}

          {showWind &&
            vectors.map((w, i) => {
              const heading = (w.direction_deg + 180) % 360;
              return (
                <Marker
                  key={i}
                  position={[w.lat, w.lon]}
                  icon={createWindIcon(heading)}
                  zIndexOffset={300}
                >
                  <Popup>
                    <strong>Wind</strong>
                    <div style={{ marginTop: 5, color: "var(--text-secondary)" }}>
                      From {w.direction_deg}° ·{" "}
                      <strong style={{ color: "var(--text)" }}>{w.speed_kmh} km/h</strong>
                    </div>
                    {(isDemoFlag || (windData.data?.is_demo ?? true)) && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#3E7C4F",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        ● Not a live wind observation
                      </div>
                    )}
                  </Popup>
                </Marker>
              );
            })}

          <RecenterButton />
        </MapContainer>

        {isDemoFlag && (
          <div className="dbb-map-note">
            <span>●</span> Illustrative data · Not live conditions
          </div>
        )}

        {showHeatmap && (
          <div className="dbb-map-legend">
            <div className="dbb-legend-title">PM2.5 index estimate</div>
            <div className="dbb-legend-scale">
              {[
                "#7FB069",
                "#C7D64F",
                "#E3D24B",
                "#E8913C",
                "#D9534F",
                "#8B3A3A",
              ].map((color) => (
                <div
                  key={color}
                  className="dbb-legend-color"
                  style={{ background: color }}
                />
              ))}
            </div>
            <div className="dbb-legend-labels">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>
        )}
      </div>

      <p className="dbb-map-footnote">
        {aqi.data?.note ?? "Live readings from the backend."}{" "}
        {windData.data?.note ?? ""} Weather data: Open-Meteo.com.{" "}
        The heatmap blends values from the reporting points to help visualise
        pollution levels. It does not measure pollution between points or
        predict smoke movement. Wind arrows show the direction the wind is
        blowing towards.
      </p>
    </section>
  );
}
