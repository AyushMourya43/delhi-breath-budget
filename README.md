# Delhi Breath Budget

Delhi Breath Budget turns air-quality data into practical planning signals:
route exposure comparisons, a profile-adjusted outdoor window, fire/wind
context, and concise advice. Read every number as an estimate with a source
and freshness label; cigarette-equivalents are an illustration, not a medical
measurement.

## Current project status

- The Next.js interface and illustrative sample responses are in `web/`.
- The FastAPI service exposes the shared endpoints with explicit demo metadata.
  Route geometry and the 48-hour rule-based forecast are illustrative, not road
  routing or live weather.
- The checked-in ingestion, database, and Telegram modules are still
  scaffolds. Live provider data, persistent storage, live Telegram alerts, and
  public deployment are not configured yet.
- No secrets belong in git. Keep credentials in local ignored environment
  files and the corresponding GitHub/Vercel/Supabase secret stores.

## Run locally

Prerequisites: Python 3.11+, Node.js 20+, and npm.

1. Create a Python virtual environment and install the engine dependencies:

   ```sh
   python3 -m venv .venv
   . .venv/bin/activate
   pip install -r engine/requirements.txt
   ```

2. Start the API from the repository root:

   ```sh
   .venv/bin/uvicorn engine.app.main:app --reload --port 8000
   ```

   Check `http://localhost:8000/health` and browse the interactive API docs at
   `http://localhost:8000/docs`. All responses are currently labeled demo data.

3. In another terminal, install and run the web app:

   ```sh
   cd web
   npm ci
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_USE_MOCK=false` in `web/.env.local` to use the local API.
   Keep it `true` (the default) to use the static mock JSON. Start the app:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000`.

## Verify

From the repository root:

```sh
./.venv/bin/pytest -q engine/tests ingest/tests advice/tests
cd web && npm test && npm run lint && npm run build
```

## API contract

The OpenAPI contract lives at `contracts/openapi.yaml`. The engine currently
implements:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | GET | Service state and data freshness |
| `/api/aqi-grid` | GET | PM2.5/AQI sample points and confidence |
| `/api/fires` | GET | Fire sample points and low-confidence smoke-risk note |
| `/api/wind` | GET | Wind sample vectors |
| `/api/routes` | POST | Exposure-ranked illustrative route corridors |
| `/api/safe-window` | POST | 48-hour profile-adjusted estimate |
| `/api/advice` | POST | Template advice using only supplied values |

All API payloads that contain sample environmental data set `is_demo: true`.
Do not remove that indicator until the endpoint is backed by verified source
data and freshness checks.

## PRD execution order

1. **Lock setup and contracts:** keep this OpenAPI file in sync with
   `contracts/examples/` and the TypeScript/Pydantic types. Decide the shared
   profile schema before parallel implementation.
2. **Make data persistent:** apply the SQL migrations in `database/`, enable
   PostGIS in Supabase, and implement ingestion for OpenAQ, Open-Meteo, and
   NASA FIRMS. Add source timestamps, validation, last-known-value behavior,
   and safe GitHub Actions secrets before enabling the scheduled workflow.
3. **Connect the engine:** replace demo fixtures with repository/service
   implementations, route-provider geometry, IDW interpolation, smoke/wind
   estimates, and Open-Meteo forecast data. Keep demo fallback explicit and
   test each edge case in the PRD.
4. **Connect the UI and advice:** set `NEXT_PUBLIC_USE_MOCK=false`, consume all
   endpoints, and show loading/error/freshness/confidence states. Keep
   template-based advice available if an LLM is unavailable.
5. **Finish alerts and deployment:** complete the Telegram bot and cooldown
   flow, configure public origins/secrets, deploy to Vercel, and verify the
   public health endpoint and complete journey on a phone.
6. **Freeze and rehearse:** freeze features, verify the numbers in the three
   demo routes, prepare an offline dataset/recording, and rehearse the short
   pitch.

## Before claiming live data

The local engine deliberately runs without credentials. Live operation still
requires provider keys, database migrations/repositories, ingestion jobs,
provider-failure tests, and a deployed backend. Never label cached or
illustrative values as current observations.