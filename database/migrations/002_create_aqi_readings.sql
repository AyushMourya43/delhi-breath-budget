CREATE TABLE IF NOT EXISTS aqi_readings (
    id bigserial PRIMARY KEY,
    station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pm25 double precision CHECK (pm25 IS NULL OR pm25 BETWEEN 0 AND 2000),
    pm10 double precision CHECK (pm10 IS NULL OR pm10 BETWEEN 0 AND 3000),
    no2 double precision CHECK (no2 IS NULL OR no2 BETWEEN 0 AND 5000),
    co double precision CHECK (co IS NULL OR co BETWEEN 0 AND 100000),
    so2 double precision CHECK (so2 IS NULL OR so2 BETWEEN 0 AND 5000),
    aqi integer CHECK (aqi IS NULL OR aqi BETWEEN 0 AND 1000),
    observed_at timestamptz NOT NULL,
    source text NOT NULL,
    is_valid boolean NOT NULL DEFAULT true,
    validation_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (station_id, observed_at, source)
);