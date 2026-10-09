CREATE TABLE IF NOT EXISTS fires (
    id bigserial PRIMARY KEY,
    external_id text NOT NULL,
    lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
    location geography(Point, 4326) NOT NULL,
    frp double precision CHECK (frp IS NULL OR frp BETWEEN 0 AND 100000),
    confidence text NOT NULL CHECK (confidence IN ('low', 'nominal', 'high')),
    acq_time timestamptz NOT NULL,
    source text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source, external_id)
);