# Delhi Breath Budget

**Understand your exposure. Choose your route. Plan your day.**

Delhi Breath Budget is a Delhi NCR air-quality planning prototype. It brings together measured PM2.5, road routes, model forecasts, satellite fire detections, and wind context to help users explore outdoor plans.

- **Website:** https://delhi-breath-budget.vercel.app
- **Backend:** https://delhi-breath-budget-api.onrender.com
- **API documentation:** https://delhi-breath-budget-api.onrender.com/docs
- **Telegram demo:** https://t.me/QiraBot_bot

> This is an environmental awareness prototype, not medical advice. A lower-exposure route or forecast window is not guaranteed safe. Reporting locations do not represent all of Delhi.

## Features

| Feature | What it does |
| --- | --- |
| Air-quality dashboard | Displays available hourly PM2.5 readings, a highest-location PM2.5 index, reporting-location count, and freshness information. |
| Interactive pollution map | Shows available monitoring locations and pollution context across Delhi NCR. |
| Route comparison | Retrieves driving routes and estimates exposure where sufficiently recent nearby measurements provide coverage. |
| Selected-route summary | Connects the selected route to the dashboard, including estimated PM2.5 and sampled-time coverage. |
| Forecast planning | Uses CAMS PM2.5 model forecasts through Open-Meteo to identify comparatively lower-exposure windows. |
| Profile guidance | Offers general guidance for adults, children, older adults, asthma-sensitive users, and outdoor workers. |
| Fire and wind context | Displays NASA FIRMS detections and wind data with experimental fire/wind screening. |
| Telegram demo | Provides pollution summaries, forecast windows, profile commands, and opt-in alerts for one paired account. |

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons |
| Mapping | Leaflet and React Leaflet |
| Backend | Python, FastAPI, Pydantic, HTTPX, Uvicorn |
| Data providers | OpenAQ, Open-Meteo / CAMS, NASA FIRMS |
| Routing and place search | OSRM and OpenStreetMap Nominatim |
| Notifications | Telegram Bot API |
| Deployment | Vercel frontend and Docker-based Render API |

## How it works

The website requests data from the FastAPI backend. The backend fetches environmental data and road routes from external providers, checks usable observations, and returns planning results with source and availability information. The Telegram process separately queries the backend and delivers replies to its paired account.

The dashboard's highest-location index is not an official overall Delhi AQI. Average PM2.5 is calculated across the locations returned by the API, rather than every monitoring station in Delhi.

## Repository structure

| Path | Purpose |
| --- | --- |
| `web/` | Next.js dashboard, maps, route comparison, and planning interface |
| `engine/` | FastAPI application, provider integrations, and calculation services |
| `advice/` | Telegram demo bot and advice-related code |
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
- Telegram bot token only if running the optional bot

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

## Telegram bot

The current bot is a **private, single-account demo**. Opening the Telegram link does not register additional users. Website profile selections are not automatically transferred to Telegram.

Add these settings to `engine/.env`:

```dotenv
TELEGRAM_BOT_TOKEN=your_bot_token
ENGINE_API_URL=http://127.0.0.1:8000
ALERT_PM25_THRESHOLD=120
```

Start the bot from the repository root:

```bash
./.venv-modern/bin/python advice/telegram_bot.py
```

On first launch, the terminal prints a pairing command. Send that exact command in a private chat with your bot. Existing paired accounts are remembered in `advice/.telegram-state.json`.

To use the deployed backend instead:

```bash
ENGINE_API_URL=https://delhi-breath-budget-api.onrender.com ./.venv-modern/bin/python advice/telegram_bot.py
```

| Command | Purpose |
| --- | --- |
| `/status` | Latest available pollution summary |
| `/window` | Forecast-based lower-exposure window |
| `/profile adult` | Select healthy-adult profile |
| `/profile child` | Select child profile |
| `/profile asthma` | Select asthma-sensitive profile |
| `/profile elderly` | Select older-adult profile |
| `/profile outdoor_worker` | Select outdoor-worker profile |
| `/alerts on` | Enable automatic alerts |
| `/alerts off` | Disable automatic alerts |
| `/testalert` | Request a labelled delivery test |
| `/stop` | Disable alerts |

The default alert threshold is 120 µg/m³. Alerts require two distinct qualifying high observations at the same location and apply a one-hour notification cooldown. These are prototype rules, not medical thresholds. A test alert verifies delivery; it does not verify the automatic threshold-triggering flow.

The bot process must remain running for replies and checks. The current backend Dockerfile only launches the API. Adding a Telegram token to that API service does not launch the bot; continuous bot operation requires a separate running process and persistent state storage.

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
| Telegram opens but does not reply | Confirm the bot process is running, the token is correct, and the account is paired. |
| Local UI does not reflect edits | Use the development server and its printed URL; production mode requires rebuilding. |
| Root API URL returns 404 | Open `/health` or `/docs` instead. |

Inspect the Python runtime with:

```bash
./.venv-modern/bin/python -c "import sys, ssl; print(sys.executable); print(ssl.OPENSSL_VERSION)"
```

## Limitations and next steps

- Measurement coverage is limited to returned reporting locations and varies over time.
- Route exposure is an experimental estimate, not a personal sensor measurement. Current routing uses driving routes.
- Forecasts are model outputs, and lower predicted pollution does not mean safe conditions.
- Fire/wind screening does not establish that a detected fire caused pollution at a location.
- Profile guidance is general; the activity selection does not currently provide a fully individualized risk model.
- Telegram public multi-user registration and continuously hosted alert delivery remain future work.
- A production database and scheduled ingestion pipeline are not required by the current direct-provider API flow; their presence in the repository does not mean they are deployed.
- External-provider availability, quotas, and data freshness affect results.

Planned improvements include broader data coverage, multi-user Telegram subscriptions, durable alert state, stronger end-to-end validation, and more detailed activity-aware planning.

## Secrets and data attribution

Never commit real API keys, bot tokens, local environment files, or Telegram state. Keep `.env.example` files limited to placeholders. Variables prefixed with `NEXT_PUBLIC_` are exposed to browsers and must not contain secrets.

Data and mapping services include OpenAQ and its original reporting providers, Open-Meteo / CAMS, NASA FIRMS / LANCE / Earthdata, OpenStreetMap contributors, and OSRM. Retain applicable attribution and review provider terms before wider distribution.
