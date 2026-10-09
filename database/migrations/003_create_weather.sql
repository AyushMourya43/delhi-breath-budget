CREATE TABLE IF NOT EXISTS weather (
    id bigserial PRIMARY KEY,
    observed_at timestamptz NOT NULL,
    lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
    location geography(Point, 4326) NOT NULL,
    wind_speed double precision CHECK (wind_speed IS NULL OR wind_speed BETWEEN 0 AND 500),
    wind_dir double precision CHECK (wind_dir IS NULL OR wind_dir BETWEEN 0 AND 360),
    temp double precision CHECK (temp IS NULL OR temp BETWEEN -100 AND 100),
    humidity double precision CHECK (humidity IS NULL OR humidity BETWEEN 0 AND 100),
    precipitation double precision CHECK (
        precipitation IS NULL OR precipitation BETWEEN 0 AND 2000
    ),
    is_forecast boolean NOT NULL DEFAULT false,
    source text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source, observed_at, lat, lon, is_forecast)
);