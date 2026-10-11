"use client";
import { useState, type FormEvent } from "react";
import {
  MapContainer,
  Polyline,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Search,
  ShieldCheck,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
type Coordinates = {
  lat: number;
  lon: number;
};
type Place = {
  name: string;
  lat: number;
  lon: number;
};
type ComparedRoute = {
  id: number;
  distanceKm: number;
  durationMinutes: number;
  exposureScore: number | null;
  cigarettes: number | null;
  coverage: number;
  reason: string | null;
  recommended: boolean;
  geometry: [number, number][];
};
type RouteResponse = {
  routes: {
    id: string;
    distance_km: number;
    duration_min: number;
    avg_pm25: number | null;
    cigarettes: number | null;
    coverage_fraction: number;
    unavailable_reason: string | null;
    recommended: boolean;
    geometry: { coordinates: [number, number][] };
  }[];
  recommendation: string;
  exposure_note: string;
};
const routeColors = ["#0d9488", "#f59e0b", "#8b5cf6"];
async function geocodePlace(query: string): Promise<Place> {
  const params = new URLSearchParams({
    viewbox: "76.5,29.3,77.8,28.0",
    bounded: "1",
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "in",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Address search is temporarily unavailable.");
  }
  const results = (await response.json()) as {
    display_name: string;
    lat: string;
    lon: string;
  }[];
  if (!results.length) {
    throw new Error(
      `We couldn't find "${query}". Try a more specific Delhi NCR address.`,
    );
  }
  return {
    name: results[0].display_name,
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
  };
}
async function getRoadRoutes(
  origin: Coordinates,
  destination: Coordinates,
): Promise<RouteResponse> {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/$/, "");
  const prefix = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${base}${prefix}/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode: "commute" }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Could not calculate routes.",
      );
    if (!Array.isArray(data.routes) || !data.routes.length)
      throw new Error("No routes returned.");
    return data as RouteResponse;
  } finally {
    clearTimeout(timer);
  }
}
function formatDuration(minutes: number) {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  return `${hours} hr ${remainingMinutes} min`;
}
function formatDistance(km: number) {
  return `${km.toFixed(1)} km`;
}
function RouteMapBounds({ routes }: { routes: ComparedRoute[] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = routes.flatMap((route) => route.geometry);
    if (allPoints.length > 0) {
      map.fitBounds(allPoints, {
        padding: [35, 35],
        maxZoom: 13,
      });
    }
  }, [map, routes]);
  return null;
}
export default function RouteComparison() {
  const [origin, setOrigin] = useState("Connaught Place, New Delhi");
  const [destination, setDestination] = useState("Anand Vihar, Delhi");
  const [originPlace, setOriginPlace] = useState<Place | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [resultNote, setResultNote] = useState("");
  const [exposureNote, setExposureNote] = useState("");
  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError("Enter both a starting point and a destination.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(false);
    setRoutes([]);
    setOriginPlace(null);
    setDestinationPlace(null);
    try {
      const start = await geocodePlace(origin.trim());
      // Small delay between geocoding requests to be considerate
      // of the public Nominatim service's usage limits.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const end = await geocodePlace(destination.trim());
      const result = await getRoadRoutes(
        { lat: start.lat, lon: start.lon },
        { lat: end.lat, lon: end.lon },
      );
      const nextRoutes: ComparedRoute[] = result.routes.map((r) => ({
        id: Number(r.id.split("-").pop()),
        distanceKm: r.distance_km,
        durationMinutes: r.duration_min,
        exposureScore: r.avg_pm25,
        cigarettes: r.cigarettes,
        coverage: r.coverage_fraction,
        reason: r.unavailable_reason,
        recommended: r.recommended,
        geometry: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      }));
      setResultNote(result.recommendation);
      setExposureNote(result.exposure_note);
      setOriginPlace(start);
      setDestinationPlace(end);
      setRoutes(nextRoutes);
      setSelectedRouteId(nextRoutes[0].id);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while finding routes.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="route-planner-panel">
      <header className="route-planner-header">
        <div>
          <h2>
            <RouteIcon size={19} />
            Pollution-aware route planner
          </h2>
          <p>Compare driving routes using available measured PM2.5.</p>
        </div>
        <span className="route-demo-badge">EXPERIMENTAL ESTIMATE</span>
      </header>
      <form className="route-search-form" onSubmit={handleSearch}>
        <div className="route-input-group">
          <label htmlFor="route-origin">Starting point</label>
          <div className="route-input-wrap">
            <MapPin size={17} />
            <input
              id="route-origin"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="e.g. Connaught Place, Delhi"
              required
            />
          </div>
        </div>
        <div className="route-input-group">
          <label htmlFor="route-destination">Destination</label>
          <div className="route-input-wrap">
            <Navigation size={17} />
            <input
              id="route-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="e.g. Anand Vihar, Delhi"
              required
            />
          </div>
        </div>
        <button
          className="route-search-button"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle size={17} className="route-spinner" />
          ) : (
            <Search size={17} />
          )}
          {loading ? "Finding routes..." : "Compare routes"}
        </button>
      </form>
      <div className="route-service-note">
        Road routes: OSRM · Place search: OpenStreetMap Nominatim
      </div>
      {error && (
        <div className="route-error" role="alert">
          {error}
        </div>
      )}
      {searched && originPlace && destinationPlace && (
        <div className="route-endpoints">
          <div>
            <span>FROM</span>
            <strong>{originPlace.name}</strong>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>TO</span>
            <strong>{destinationPlace.name}</strong>
          </div>
        </div>
      )}
      {routes.length > 0 && (
        <>
          <div className="route-results-heading">
            <div>
              <h3>Available driving routes</h3>
              <p>{resultNote}</p>
            </div>
            <span>{routes.length} found</span>
          </div>
          <div className="route-results-layout">
            <div className="route-results-list">
              {routes.map((route, index) => {
                const selected = route.id === selectedRouteId;
                const color = routeColors[index % routeColors.length];
                return (
                  <button
                    type="button"
                    key={`${route.id}-${route.distanceKm}`}
                    className={`route-result-card ${
                      selected ? "route-result-selected" : ""
                    }`}
                    onClick={() => setSelectedRouteId(route.id)}
                    aria-pressed={selected}
                  >
                    <div className="route-result-top">
                      <span
                        className="route-color-indicator"
                        style={{ backgroundColor: color }}
                      />
                      <strong>
                        Route {route.id}
                        {route.recommended ? " · Lowest estimate" : ""}
                      </strong>
                      {selected && (
                        <span className="route-selected-label">Selected</span>
                      )}
                    </div>
                    <div className="route-result-metrics">
                      <div>
                        <Navigation size={14} />
                        <strong>{formatDistance(route.distanceKm)}</strong>
                      </div>
                      <div>
                        <Clock3 size={14} />
                        <strong>{formatDuration(route.durationMinutes)}</strong>
                      </div>
                    </div>
                    <div className="route-exposure-row">
                      <span>Estimated route PM2.5</span>
                      <strong>
                        {route.exposureScore === null
                          ? "Unavailable"
                          : `${route.exposureScore.toFixed(1)} µg/m³`}
                      </strong>
                    </div>
                    <div className="route-exposure-row">
                      <span>Sampled time coverage</span>
                      <strong>{(route.coverage * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="route-exposure-row">
                      <span>Cigarette-equivalents · illustration</span>
                      <strong>
                        {route.cigarettes === null
                          ? "Unavailable"
                          : route.cigarettes.toFixed(4)}
                      </strong>
                    </div>
                    {route.reason && <p>{route.reason}</p>}
                    <div className="route-exposure-track">
                      <span
                        style={{
                          width: `${Math.min(
                            100,
                            ((route.exposureScore ?? 0) / 150) * 100,
                          )}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="route-results-map">
              <MapContainer
                center={[28.6139, 77.209]}
                zoom={11}
                scrollWheelZoom
                zoomControl={false}
                className="route-leaflet-map"
              >
                <ZoomControl position="topright" />
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {routes.map((route, index) => {
                  const selected = route.id === selectedRouteId;
                  return (
                    <Polyline
                      key={route.id}
                      positions={route.geometry}
                      pathOptions={{
                        color: routeColors[index % routeColors.length],
                        weight: selected ? 6 : 3,
                        opacity: selected ? 0.95 : 0.4,
                      }}
                      eventHandlers={{
                        click: () => setSelectedRouteId(route.id),
                      }}
                    >
                      <Popup>
                        <strong>
                          Route {route.id}
                          {route.recommended ? " · Lowest estimate" : ""}
                        </strong>
                        <br />
                        Distance: {formatDistance(route.distanceKm)}
                        <br />
                        Estimated driving time:{" "}
                        {formatDuration(route.durationMinutes)}
                      </Popup>
                    </Polyline>
                  );
                })}
                {originPlace && (
                  <CircleMarker
                    center={[originPlace.lat, originPlace.lon]}
                    radius={7}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 2,
                      fillColor: "#2563eb",
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>Starting point: {originPlace.name}</Popup>
                  </CircleMarker>
                )}
                {destinationPlace && (
                  <CircleMarker
                    center={[destinationPlace.lat, destinationPlace.lon]}
                    radius={7}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 2,
                      fillColor: "#dc2626",
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>Destination: {destinationPlace.name}</Popup>
                  </CircleMarker>
                )}
                <RouteMapBounds routes={routes} />
              </MapContainer>
            </div>
          </div>
          {selectedRoute && (
            <div className="route-selection-summary">
              <ShieldCheck size={19} />
              <div>
                <strong>Route {selectedRoute.id} selected</strong>
                <p>
                  {formatDistance(selectedRoute.distanceKm)} ·{" "}
                  {formatDuration(selectedRoute.durationMinutes)} · Estimated
                  route PM2.5:{" "}
                  {selectedRoute.exposureScore === null
                    ? "Unavailable"
                    : `${selectedRoute.exposureScore.toFixed(1)} µg/m³`}
                </p>
              </div>
            </div>
          )}
          <p className="route-disclaimer">
            {exposureNote} PM2.5: OpenAQ and original providers.{" "}
          </p>
        </>
      )}
      {!loading && !error && routes.length === 0 && (
        <div className="route-empty-state">
          <div className="route-empty-icon">
            <RouteIcon size={23} />
          </div>
          <strong>Compare your journey</strong>
          <p>
            Enter your origin and destination to retrieve available driving
            routes and compare their distance, estimated time, and exposure
            estimates where coverage permits.
          </p>
        </div>
      )}
    </section>
  );
}
