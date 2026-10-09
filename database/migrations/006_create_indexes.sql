CREATE INDEX IF NOT EXISTS stations_location_gix
    ON stations USING gist (location);
CREATE INDEX IF NOT EXISTS stations_active_idx
    ON stations (is_active, source);

CREATE INDEX IF NOT EXISTS aqi_readings_station_time_idx
    ON aqi_readings (station_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS aqi_readings_valid_time_idx
    ON aqi_readings (observed_at DESC)
    WHERE is_valid;

CREATE INDEX IF NOT EXISTS weather_location_gix
    ON weather USING gist (location);
CREATE INDEX IF NOT EXISTS weather_time_forecast_idx
    ON weather (observed_at DESC, is_forecast);

CREATE INDEX IF NOT EXISTS fires_location_gix
    ON fires USING gist (location);
CREATE INDEX IF NOT EXISTS fires_time_idx
    ON fires (acq_time DESC);

CREATE INDEX IF NOT EXISTS forecast_aqi_location_gix
    ON forecast_aqi USING gist (location);
CREATE INDEX IF NOT EXISTS forecast_aqi_time_idx
    ON forecast_aqi (forecast_at, generated_at DESC);