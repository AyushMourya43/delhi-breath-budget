"use client";

import { useState } from "react";
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

type SampleStation = {
  name: string;
  pm25: number;
  lat: number;
  lon: number;
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
};

type ComparedRoute = {
  id: number;
  distanceKm: number;
  durationMinutes: number;
  exposureScore: number;
  geometry: [number, number][];
};

const sampleStations: SampleStation[] = [
  { name: "Anand Vihar", pm25: 118, lat: 28.6469, lon: 77.316 },
  { name: "Connaught Place", pm25: 72, lat: 28.6315, lon: 77.2167 },
  { name: "Dwarka", pm25: 54, lat: 28.5921, lon: 77.046 },
  { name: "Rohini", pm25: 83, lat: 28.7495, lon: 77.0565 },
  { name: "Lodhi Road", pm25: 42, lat: 28.5918, lon: 77.2273 },
];

const routeColors = ["#0d9488", "#f59e0b", "#8b5cf6"];

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

async function geocodePlace(query: string): Promise<Place> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "in",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`
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
      `We couldn't find "${query}". Try a more specific Delhi NCR address.`
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
  destination: Coordinates
): Promise<ComparedRoute[]> {
  const coordinates = [
    `${origin.lon},${origin.lat}`,
    `${destination.lon},${destination.lat}`,
  ].join(";");

  const params = new URLSearchParams({
    alternatives: "true",
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      "The routing service is unavailable. Please try again shortly."
    );
  }

  const data = (await response.json()) as {
    code: string;
    message?: string;
    routes: OsrmRoute[];
  };

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(
      data.message || "No driving routes were found between these places."
    );
  }

  return data.routes.map((route, index) => {
    const geometry: [number, number][] =
      route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

    return {
      id: index + 1,
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      exposureScore: estimateSampleExposure(geometry),
      geometry,
    };
  });
}

/*
 * Demonstration-only estimate.
 *
 * This finds sample stations near sampled points along a route.
 * It is not a measured route-level PM2.5 concentration or personal dose.
 */
function estimateSampleExposure(
  geometry: [number, number][]
): number {
  if (!geometry.length) return 0;

  const stride = Math.max(1, Math.floor(geometry.length / 60));
  const sampledPoints = geometry.filter(
    (_, index) => index % stride === 0
  );

  if (
    sampledPoints.length &&
    sampledPoints[sampledPoints.length - 1] !== geometry[geometry.length - 1]
  ) {
    sampledPoints.push(geometry[geometry.length - 1]);
  }

  const nearbyReadings: number[] = [];

  for (const [lat, lon] of sampledPoints) {
    let nearestStation: SampleStation | null = null;
    let nearestDistance = Infinity;

    for (const station of sampleStations) {
      const distance = haversineKm(
        lat,
        lon,
        station.lat,
        station.lon
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStation = station;
      }
    }

    // Only use sample stations within 3 km of a sampled route point.
    if (nearestStation && nearestDistance <= 3) {
      nearbyReadings.push(nearestStation.pm25);
    }
  }

  if (nearbyReadings.length === 0) {
    return Math.round(
      sampleStations.reduce((sum, station) => sum + station.pm25, 0) /
        sampleStations.length
    );
  }

  return Math.round(
    nearbyReadings.reduce((sum, value) => sum + value, 0) /
      nearbyReadings.length
  );
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

function RouteMapBounds({
  routes,
}: {
  routes: ComparedRoute[];
}) {
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
  const [destination, setDestination] = useState(
    "Anand Vihar, Delhi"
  );

  const [originPlace, setOriginPlace] = useState<Place | null>(null);
  const [destinationPlace, setDestinationPlace] =
    useState<Place | null>(null);

  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0];

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
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

      const nextRoutes = await getRoadRoutes(
        { lat: start.lat, lon: start.lon },
        { lat: end.lat, lon: end.lon }
      );

      setOriginPlace(start);
      setDestinationPlace(end);
      setRoutes(nextRoutes);
      setSelectedRouteId(nextRoutes[0].id);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while finding routes."
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
          <p>
            Find road routes and compare illustrative pollution exposure.
          </p>
        </div>

        <span className="route-demo-badge">PROTOTYPE</span>
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
              <p>
                Choose a route to highlight it on the map.
              </p>
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

                      <strong>Route {route.id}</strong>

                      {selected && (
                        <span className="route-selected-label">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="route-result-metrics">
                      <div>
                        <Navigation size={14} />
                        <strong>{formatDistance(route.distanceKm)}</strong>
                      </div>

                      <div>
                        <Clock3 size={14} />
                        <strong>
                          {formatDuration(route.durationMinutes)}
                        </strong>
                      </div>
                    </div>

                    <div className="route-exposure-row">
                      <span>Sample exposure index</span>
                      <strong>{route.exposureScore}</strong>
                    </div>

                    <div className="route-exposure-track">
                      <span
                        style={{
                          width: `${Math.min(
                            100,
                            (route.exposureScore / 150) * 100
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                        <strong>Route {route.id}</strong>
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
                    center={[
                      destinationPlace.lat,
                      destinationPlace.lon,
                    ]}
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
                <strong>
                  Route {selectedRoute.id} selected
                </strong>
                <p>
                  {formatDistance(selectedRoute.distanceKm)} ·{" "}
                  {formatDuration(selectedRoute.durationMinutes)} ·
                  Sample exposure index: {selectedRoute.exposureScore}
                </p>
              </div>
            </div>
          )}

          <p className="route-disclaimer">
            Driving distances and route geometry come from the routing
            service. Travel times are estimates and do not account for
            live traffic. Exposure indices are calculated from fictional
            sample station readings and are not measured pollution,
            inhaled dose, or validated health-risk scores. Public demo
            services may impose usage limits.
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
            Enter your origin and destination to retrieve available
            driving routes and compare their distance, estimated time,
            and demonstration exposure index.
          </p>
        </div>
      )}
    </section>
  );
}