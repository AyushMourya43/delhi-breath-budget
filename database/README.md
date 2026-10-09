# Supabase database setup

The SQL migrations create the shared PRD tables and spatial indexes. They are
idempotent and should be run in numeric order in the Supabase SQL editor:

1. `001_create_stations.sql`
2. `002_create_aqi_readings.sql`
3. `003_create_weather.sql`
4. `004_create_fires.sql`
5. `005_create_forecast_aqi.sql`
6. `006_create_indexes.sql`
7. `007_enable_postgis.sql`

PostGIS is enabled by the first migration because the table definitions need
the `geography` type; migration 007 is retained as an idempotent setup check.
For every point, store longitude first in PostGIS constructors:
`ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography`.

AQI readings retain invalid rows with `is_valid = false` and a
`validation_note`; exclude them from interpolation and alert rules instead of
silently dropping their provenance. Use UTC `timestamptz` values in storage
and convert to Asia/Kolkata only for display.

The current engine does not connect to this database yet. Do not put demo
records into production tables as if they were observations. Configure a
Supabase service-role key only in the ingestion/backend environment, never in
the browser bundle.