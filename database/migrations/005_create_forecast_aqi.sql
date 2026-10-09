CREATE TABLE IF NOT EXISTS forecast_aqi (
    id bigserial PRIMARY KEY,
    forecast_at timestamptz NOT NULL,
    generated_at timestamptz NOT NULL DEFAULT now(),
    lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
    location geography(Point, 4326) NOT NULL,
    pm25_pred double precision NOT NULL CHECK (pm25_pred BETWEEN 0 AND 2000),
    confidence double precision NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    source text NOT NULL,
    is_estimate boolean NOT NULL DEFAULT true,
    UNIQUE (source, forecast_at, lat, lon)
);