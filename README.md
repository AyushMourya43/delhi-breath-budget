# Delhi Breath Budget

**Understand your exposure. Choose your route. Plan your day.**

Delhi Breath Budget is a Delhi NCR air-quality planning prototype. It brings together measured PM2.5, road routes, model forecasts, satellite fire detections, and wind context to help users explore outdoor plans.

- **Website:** https://delhi-breath-budget.vercel.app
- **Backend:** https://delhi-breath-budget-api.onrender.com
- **API documentation:** https://delhi-breath-budget-api.onrender.com/docs

> This is an environmental awareness prototype, not medical advice. A lower-exposure route or forecast window is not guaranteed safe. Reporting locations do not represent all of Delhi.

## Features

| Feature | What it does |
| --- | --- |
| Air-quality dashboard | Displays available hourly PM2.5 readings, a highest-location PM2.5 index, reporting-location count, and freshness information. |
| Interactive pollution map | Shows available monitoring locations and pollution context across Delhi NCR on a keyless OpenStreetMap.de basemap. |
| Route comparison | Retrieves driving routes and estimates exposure where sufficiently recent nearby measurements provide coverage, with the same keyless basemap. |
| Selected-route summary | Connects the selected route to the dashboard, including estimated PM2.5 and sampled-time coverage. |
| Forecast planning | Uses CAMS PM2.5 model forecasts through Open-Meteo to identify comparatively lower-exposure windows. |
| Profile guidance | Offers general guidance for adults, children, older adults, asthma-sensitive users, and outdoor workers. |
| Plan My Day | Builds a daily schedule from activities and durations, compares illustrative sample PM2.5 across time slots, and exports the plan as an Excel workbook. This planner uses demonstration data, not live readings. |
| Fire and wind context | Displays NASA FIRMS detections and wind data with experimental fire/wind screening. |

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons |
| Mapping | Leaflet and React Leaflet; OpenStreetMap.de raster tiles with OpenStreetMap attribution |
| Backend | Python, FastAPI, Pydantic, HTTPX, Uvicorn |
| Data providers | OpenAQ, Open-Meteo / CAMS, NASA FIRMS |
| Routing and place search | OSRM and OpenStreetMap Nominatim |
| Deployment | Vercel frontend and Docker-based Render API |

## How it works

The website requests data from the FastAPI backend. The backend fetches environmental data and road routes from external providers, checks usable observations, and returns planning results with source and availability information.

The dashboard's highest-location index is not an official overall Delhi AQI. Average PM2.5 is calculated across the locations returned by the API, rather than every monitoring station in Delhi.

The **Plan My Day** page is a separate demonstration planner: its sample PM2.5 values are not live measurements or a validated forecast. Its duration-weighted concentration comparison and illustrative concentration-duration index are not an estimate of inhaled dose or health risk.

## Repository structure

| Path | Purpose |
| --- | --- |
| `web/` | Next.js dashboard, maps, route comparison, and planning interface |
| `engine/` | FastAPI application, provider integrations, and calculation services |
| `advice/` | Advice and alert-related modules |
| `ingest/` | Ingestion-related modules; not a claim of a deployed scheduled pipeline |
| `database/` | Database definitions and migration groundwork |
| `contracts/` | API contract and example payloads |
| `deployment/` | Backend Dockerfile and deployment dependencies |

## Local setup

### 1. Prerequisites

- Python 3.12 with OpenSSL support, matching the deployment runtime
- Node.js 20 or newer and npm
- Git
- OpenAQ API key for measured pollution data
- NASA FIRMS map key for satellite fire data

### 2. Clone the repository

```bash
git clone https://github.com/AyushMourya43/delhi-breath-budget.git
cd delhi-breath-budget
```

### 3. Install the backend

```bash
python3.12 -m venv .venv-modern
./.venv-modern/bin/python -m pip install --upgrade pip
./.venv-modern/bin/python -m pip install -r deployment/requirements-deploy.txt
```

This installs the dependencies used by the deployed API. The broader `engine/requirements.txt` includes additional development and modelling dependencies.

Create `engine/.env` with your own values:

```dotenv
OPENAQ_API_KEY=your_openaq_api_key
FIRMS_MAP_KEY=your_firms_map_key
```

Start the backend from the repository root:

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001 ./.venv-modern/bin/python -m uvicorn engine.app.main:app --reload --port 8000
```

- Health: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs

### 4. Start the frontend

In another terminal:

```bash
cd web
npm ci
```

Create `web/.env.local`:

```dotenv
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api
```

Then run:

```bash
npm run dev
```

Open the localhost URL printed in the terminal, normally http://localhost:3000. If Next.js chooses another port, add that exact origin to the backend's `CORS_ORIGINS` and restart the backend.

`NEXT_PUBLIC_USE_MOCK=true` selects the frontend's sample data. Use `false` to connect to the API. Restart the development server after changing environment variables.

## Deployment configuration

### Backend: Render

The project uses `deployment/Dockerfile` with the repository root as its Docker build context. The Dockerfile starts Uvicorn on port `7860`.

Configure the backend environment:

```dotenv
OPENAQ_API_KEY=your_openaq_api_key
FIRMS_MAP_KEY=your_firms_map_key
PORT=7860
CORS_ORIGINS=https://delhi-breath-budget.vercel.app,http://localhost:3000,http://localhost:3001
```

Use `/health` for health checks. The root `/` can return 404 because this service provides API endpoints rather than a homepage.

### Frontend: Vercel

Use `web` as the project root, with the Next.js framework preset and `npm run build` as the build command.

Set:

```dotenv
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://delhi-breath-budget-api.onrender.com
NEXT_PUBLIC_API_PREFIX=/api
```

Redeploy after changing frontend environment variables. If your frontend domain changes, update the backend CORS allowlist with its exact origin, without a trailing slash.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health information |
| GET | `/api/health` | Alternative health endpoint |
| GET | `/api/aqi-grid` | Available PM2.5 locations and freshness metadata |
| GET | `/api/fires` | Satellite fire detections and screening context |
| GET | `/api/wind` | Wind information |
| POST | `/api/routes` | Driving routes and coverage-dependent exposure estimates |
| POST | `/api/safe-window` | Forecast-based lower-exposure planning window |
| POST | `/api/advice` | Template-based guidance using supplied inputs |

Use the running application's `/docs` page for request and response schemas. The endpoint name `safe-window` does not imply guaranteed safety.

## Frontend checks

From `web/`:

```bash
npm run lint
npm test
npm run build
```

For local editing, use `npm run dev`. `npm start` serves the production build and requires a new build to include source changes.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| CORS preflight returns 400 | Add the exact website origin to `CORS_ORIGINS` and restart/redeploy the backend. |
| Routes return 503 | Check backend logs, routing-provider connectivity, and whether a road route exists between the selected points. |
| Route exposure shows a dash | Check measurement freshness and sampled-time coverage. Insufficient coverage intentionally withholds estimates. |
| Local HTTPS/provider requests fail | Check the Python interpreter and SSL version; use a modern OpenSSL-backed environment. |
| Local UI does not reflect edits | Use the development server and its printed URL; production mode requires rebuilding. |
| Root API URL returns 404 | Open `/health` or `/docs` instead. |

Inspect the Python runtime with:

```bash
./.venv-modern/bin/python -c "import sys, ssl; print(sys.executable); print(ssl.OPENSSL_VERSION)"
```

## Limitations and next steps

- Measurement coverage is limited to returned reporting locations and varies over time.
- Route exposure is an experimental estimate, not a personal sensor measurement. Current routing uses driving routes.
- Plan My Day uses illustrative sample readings; it does not calculate measured daily exposure or personal inhaled dose.
- Forecasts are model outputs, and lower predicted pollution does not mean safe conditions.
- Fire/wind screening does not establish that a detected fire caused pollution at a location.
- Profile guidance is general; the activity selection does not currently provide a fully individualized risk model.
- A production database and scheduled ingestion pipeline are not required by the current direct-provider API flow; their presence in the repository does not mean they are deployed.
- External-provider availability, quotas, and data freshness affect results.

Planned improvements include broader data coverage, stronger end-to-end validation, and more detailed activity-aware planning.

## Secrets and data attribution

Never commit real API keys or local environment files. Keep `.env.example` files limited to placeholders. Variables prefixed with `NEXT_PUBLIC_` are exposed to browsers and must not contain secrets.

Data and mapping services include OpenAQ and its original reporting providers, Open-Meteo / CAMS, NASA FIRMS / LANCE / Earthdata, OpenStreetMap contributors, and OSRM. Retain applicable attribution and review provider terms before wider distribution.

The dashboard and route-comparison maps use `https://tile.openstreetmap.de/{z}/{x}/{y}.png`; no map API key is required. The base tiles are visually darkened by the frontend to match the dashboard theme. Keep the visible OpenStreetMap and OpenStreetMap.de attribution, and follow the tile provider's current usage policy.
