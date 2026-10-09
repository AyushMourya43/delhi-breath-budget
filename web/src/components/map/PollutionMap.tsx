"use client";

import { useEffect, useState } from "react";
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
import type { AQIGridResponse, AQIPoint } from "../../types/air-quality";
import type { FiresResponse } from "../../types/fire";
import type { WindResponse } from "../../types/weather";

const DELHI_CENTER: [number, number] = [28.6139, 77.209];
const REFRESH_MS = 5 * 60 * 1000;

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#84cc16";
  if (aqi <= 200) return "#f59e0b";
  if (aqi <= 300) return "#f97316";
  if (aqi <= 400) return "#ef4444";
  return "#991b1b";
}

function createStationIcon(station: AQIPoint) {
  const color = getAqiColor(station.aqi);

  return L.divIcon({
    className: "dbb-station-icon",
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:3px;
        transform:translateY(-2px);
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          min-width:36px;
          height:29px;
          padding:0 5px;
          border:2px solid white;
          border-radius:9px;
          background:${color};
          color:#fff;
          font-size:12px;
          font-weight:800;
          line-height:1;
          box-shadow:0 2px 8px rgba(15,23,42,.25);
        ">${station.aqi}</div>
        <div style="
          width:7px;
          height:7px;
          border:2px solid white;
          border-radius:50%;
          background:${color};
          box-shadow:0 1px 4px rgba(15,23,42,.25);
        "></div>
      </div>
    `,
    iconSize: [44, 43],
    iconAnchor: [22, 40],
    popupAnchor: [0, -38],
  });
}

function createFireIcon() {
  return L.divIcon({
    className: "dbb-fire-icon",
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:29px;
        height:29px;
        border:2px solid white;
        border-radius:50%;
        background:#dc2626;
        color:white;
        font-size:16px;
        box-shadow:0 2px 8px rgba(127,29,29,.35);
      " aria-hidden="true">🔥</div>
    `,
    iconSize: [29, 29],
    iconAnchor: [14, 14],
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
          width="27"
          height="27"
          aria-hidden="true"
          style="transform:rotate(${degrees}deg)"
        >
          <path
            d="M16 26V6"
            fill="none"
            stroke="#087f8c"
            stroke-width="3.5"
            stroke-linecap="round"
          />
          <path
            d="M7.5 14.5L16 6L24.5 14.5"
            fill="none"
            stroke="#087f8c"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
  points: AQIPoint[];
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
      minOpacity: 0.2,
      max: 1,
      maxZoom: 12,
      gradient: {
        0.15: "#22c55e",
        0.35: "#a3e635",
        0.55: "#facc15",
        0.75: "#f97316",
        1: "#dc2626",
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
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
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

function MapStyles() {
  return (
    <style>{`
      .dbb-map-wrap {
        position: relative;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        border-radius: 14px;
        background: #e8f0ec;
      }

      .dbb-map {
        width: 100%;
        height: 440px;
        min-height: 360px;
        z-index: 1;
        background: #e8f0ec;
      }

      .dbb-map .leaflet-control-attribution {
        font-size: 9px;
      }

      .dbb-map .leaflet-popup-content-wrapper {
        border-radius: 12px;
      }

      .dbb-map .leaflet-popup-content {
        margin: 12px 14px;
        line-height: 1.5;
      }

      .dbb-station-icon,
      .dbb-fire-icon,
      .dbb-wind-icon {
        background: transparent;
        border: 0;
      }

      .dbb-wind-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .wind-arrow-shell {
        display: flex;
        width: 40px;
        height: 40px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(8,127,140,.24);
        border-radius: 50%;
        background: rgba(255,255,255,.94);
        box-shadow: 0 3px 10px rgba(15,23,42,.2);
      }

      .wind-arrow-svg {
        display: block;
        filter: drop-shadow(0 1px 1px rgba(255,255,255,.9));
      }

      .dbb-recenter-button {
        position: absolute;
        z-index: 500;
        top: 12px;
        right: 12px;
        display: flex;
        width: 38px;
        height: 38px;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #fff;
        color: #334155;
        box-shadow: 0 2px 8px rgba(15,23,42,.12);
        cursor: pointer;
      }

      .dbb-recenter-button:hover {
        background: #f1f5f9;
        color: #087f8c;
      }

      .dbb-map-legend {
        position: absolute;
        z-index: 400;
        left: 12px;
        bottom: 28px;
        width: min(230px, calc(100% - 24px));
        padding: 12px;
        border: 1px solid rgba(226,232,240,.95);
        border-radius: 12px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 3px 12px rgba(15,23,42,.12);
        pointer-events: none;
      }

      .dbb-legend-title {
        margin-bottom: 8px;
        color: #334155;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .dbb-legend-scale {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 3px;
        margin-bottom: 5px;
      }

      .dbb-legend-color {
        height: 7px;
        border-radius: 3px;
      }

      .dbb-legend-labels {
        display: flex;
        justify-content: space-between;
        color: #64748b;
        font-size: 10px;
      }

      .dbb-map-note {
        position: absolute;
        z-index: 400;
        top: 12px;
        left: 12px;
        max-width: calc(100% - 65px);
        padding: 8px 10px;
        border: 1px solid rgba(226,232,240,.9);
        border-radius: 9px;
        background: rgba(255,255,255,.95);
        color: #475569;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 7px rgba(15,23,42,.08);
        pointer-events: none;
      }

      .dbb-map-note span {
        color: #b45309;
      }

      .dbb-map-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
      }

      .dbb-map-heading {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .dbb-map-heading h2 {
        margin: 0;
        color: #0f172a;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -.02em;
      }

      .dbb-map-heading p {
        margin: 5px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.5;
      }

      .dbb-map-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border: 1px solid #fed7aa;
        border-radius: 999px;
        background: #fff7ed;
        color: #9a3412;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
      }

      .dbb-map-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #f97316;
      }

      .dbb-layer-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .dbb-layer-toggle {
        display: inline-flex;
        min-height: 35px;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 7px 11px;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        background: #fff;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background .15s ease, border-color .15s ease,
          color .15s ease;
      }

      .dbb-layer-toggle:hover {
        border-color: #99f6e4;
      }

      .dbb-layer-toggle[aria-pressed="true"] {
        border-color: #99f6e4;
        background: #f0fdfa;
        color: #0f766e;
      }

      .dbb-toggle-dot {
        width: 8px;
        height: 8px;
        flex: 0 0 auto;
        border-radius: 50%;
      }

      .dbb-map-footnote {
        margin: 0;
        color: #64748b;
        font-size: 11px;
        line-height: 1.6;
      }

      .dbb-map-error {
        padding: 8px 10px;
        border: 1px solid #fecaca;
        border-radius: 9px;
        background: #fef2f2;
        color: #991b1b;
        font-size: 11px;
      }

      @media (max-width: 640px) {
        .dbb-map {
          height: 390px;
          min-height: 340px;
        }

        .wind-arrow-shell {
          width: 34px;
          height: 34px;
        }

        .wind-arrow-svg {
          width: 23px;
          height: 23px;
        }

        .dbb-map-legend {
          bottom: 24px;
          padding: 9px;
        }

        .dbb-layer-toggle {
          flex: 1 1 auto;
        }
      }
    `}</style>
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
        style={{ background: enabled ? color : "#cbd5e1" }}
      />
      {label}
      <span aria-hidden="true">{enabled ? "✓" : "+"}</span>
    </button>
  );
}

export default function PollutionMap() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showFires, setShowFires] = useState(true);
  const [showWind, setShowWind] = useState(true);

  const aqi = useAQIGrid<AQIGridResponse>();
  const fireData = useApiResource<FiresResponse>("/fires", REFRESH_MS);
  const windData = useApiResource<WindResponse>("/wind", REFRESH_MS);

  const points = aqi.data?.points ?? [];
  const fires = fireData.data?.fires ?? [];
  const vectors = windData.data?.vectors ?? [];
  const isDemo = aqi.data?.is_demo ?? true;
  const loadError = aqi.error || fireData.error || windData.error;

  return (
    <section className="dbb-map-panel" aria-label="Delhi pollution map">
      <MapStyles />

      <div className="dbb-map-heading">
        <div>
          <h2>Delhi Pollution Map</h2>
          <p>
            Explore pollution levels, wind direction and fire hotspots.
          </p>
        </div>

        {isDemo && (
          <div className="dbb-map-status">
            <span className="dbb-map-status-dot" />
            DEMO DATA
          </div>
        )}
      </div>

      {loadError && <div className="dbb-map-error">Data error: {loadError}</div>}

      <div className="dbb-layer-controls" aria-label="Map layers">
        <LayerToggle
          label="Heatmap"
          color="#f97316"
          enabled={showHeatmap}
          onClick={() => setShowHeatmap((value) => !value)}
        />

        <LayerToggle
          label="AQI Stations"
          color="#0d9488"
          enabled={showStations}
          onClick={() => setShowStations((value) => !value)}
        />

        <LayerToggle
          label="Fire Hotspots"
          color="#dc2626"
          enabled={showFires}
          onClick={() => setShowFires((value) => !value)}
        />

        <LayerToggle
          label="Wind Direction"
          color="#087f8c"
          enabled={showWind}
          onClick={() => setShowWind((value) => !value)}
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <PollutionHeatLayer enabled={showHeatmap} points={points} />

          {showStations &&
            points.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lon]}
                icon={createStationIcon(p)}
              >
                <Popup>
                  <div style={{ minWidth: 145 }}>
                    <strong
                      style={{
                        display: "block",
                        marginBottom: 7,
                        color: "#0f172a",
                        fontSize: 13,
                      }}
                    >
                      {p.name}
                    </strong>

                    <div style={{ marginBottom: 5 }}>
                      AQI:{" "}
                      <strong style={{ color: getAqiColor(p.aqi) }}>
                        {p.aqi} · {p.category}
                      </strong>
                    </div>

                    <div>
                      PM2.5: <strong>{p.pm25} µg/m³</strong>
                    </div>

                    <div style={{ marginTop: 5, fontSize: 11 }}>
                      Confidence: {Math.round(p.confidence * 100)}%
                      {p.is_estimated && " · estimated (nearest station is far)"}
                    </div>

                    {isDemo && (
                      <div
                        style={{
                          marginTop: 8,
                          color: "#b45309",
                          fontSize: 10,
                        }}
                      >
                        Illustrative reading — not live data
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {showFires &&
            fires.map((f) => (
              <Marker
                key={f.id}
                position={[f.lat, f.lon]}
                icon={createFireIcon()}
              >
                <Popup>
                  <strong>Fire hotspot</strong>
                  <div style={{ marginTop: 5 }}>FRP: {f.frp} MW</div>
                  <div>Detection confidence: {f.confidence}</div>
                  {isDemo && (
                    <div
                      style={{
                        marginTop: 6,
                        color: "#b45309",
                        fontSize: 10,
                      }}
                    >
                      Not a verified active fire
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}

          {showWind &&
            vectors.map((w, i) => {
              // JSON mein direction "FROM" hai, arrow "TOWARDS" dikhana hai.
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
                    <div style={{ marginTop: 5 }}>
                      From {w.direction_deg}° · {w.speed_kmh} km/h
                    </div>
                    {isDemo && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#b45309",
                          fontSize: 10,
                        }}
                      >
                        Not a live wind observation
                      </div>
                    )}
                  </Popup>
                </Marker>
              );
            })}

          <RecenterButton />
        </MapContainer>

        {isDemo && (
          <div className="dbb-map-note">
            <span>●</span> Illustrative data · Not live conditions
          </div>
        )}

        {showHeatmap && (
          <div className="dbb-map-legend">
            <div className="dbb-legend-title">AQI Intensity</div>

            <div className="dbb-legend-scale">
              {[
                "#22c55e",
                "#a3e635",
                "#facc15",
                "#fb923c",
                "#ef4444",
                "#991b1b",
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
        The heatmap blends values from the sample points to help
        visualise pollution levels. It does not measure pollution between
        points or predict smoke movement. Wind arrows show the direction
        the wind is blowing towards.
      </p>
    </section>
  );
}