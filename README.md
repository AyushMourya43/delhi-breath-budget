# Delhi Breath Budget

### Turning Air Pollution Data into Smarter Everyday Decisions

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-16A34A?style=for-the-badge)](https://delhi-breath-budget.vercel.app/)

**Delhi Breath Budget** is an environmental-awareness platform designed to transform air-quality data into practical, personalized decisions. It helps people understand pollution exposure, compare travel routes, explore fire and wind conditions, and identify potentially better times for outdoor activities.

Instead of simply displaying AQI values, Delhi Breath Budget aims to answer three important questions:

- **What is the pollution cost of my journey?**
- **Where might regional smoke be coming from, and how could it affect Delhi-NCR?**
- **When and where might it be better to go outdoors?**

**Live Application:** https://delhi-breath-budget.vercel.app/

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [What Makes Delhi Breath Budget Different?](#what-makes-delhi-breath-budget-different)
- [Target Users](#target-users)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Application Workflow](#application-workflow)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Development Roadmap](#development-roadmap)
- [Data Sources](#data-sources)
- [Accuracy, Safety, and Limitations](#accuracy-safety-and-limitations)
- [Contributing](#contributing)
- [Future Scope](#future-scope)
- [Team](#team)
- [License](#license)

---

## Problem Statement

Air pollution is a major environmental challenge in Delhi-NCR. People are exposed to changing pollution levels during their daily commutes, outdoor activities, and work.

Although air-quality data is available through monitoring stations and public platforms, raw AQI and pollutant measurements do not always translate into clear everyday decisions.

People need more actionable information:

- Which route may expose them to less pollution?
- When might outdoor exercise or recreational activity be more suitable?
- Could fire hotspots and wind conditions contribute to regional smoke?
- How should recommendations change for children, older adults, asthma-sensitive individuals, and outdoor workers?
- How can environmental information be communicated in a way that is easier to understand?

Delhi Breath Budget addresses these challenges by bringing air quality, route exposure, weather, wind, fire information, and personalized guidance together in one platform.

## Our Solution

Delhi Breath Budget converts environmental information into practical planning insights through an interactive web application.

The platform combines:

1. **Air-quality visualization** to explore pollution conditions across Delhi-NCR.
2. **Route exposure comparison** to compare alternative journeys using estimated pollution exposure.
3. **Fire and wind analysis** to understand regional environmental conditions and possible smoke movement.
4. **Personalized outdoor guidance** based on user profiles and activity types.
5. **Safe-window estimation** to identify potentially lower-risk periods for outdoor activities.
6. **Environmental alerts** to communicate important changes and emerging risks.

Our objective is to make air-quality information more understandable, contextual, and useful for everyday decision-making.

---

## Key Features

### 1. Interactive Air Pollution Map

Explore air-quality information through an interactive map centered on Delhi-NCR.

Features include:

- AQI and PM2.5 visualization.
- Pollution heatmap for understanding spatial variation.
- Air-quality station markers.
- Fire-hotspot visualization.
- Wind-direction indicators.
- Interactive map layers.
- Pollution and environmental-risk summaries.
- Data-status and freshness information.

The map provides a geographic perspective on environmental conditions rather than presenting air-quality readings in isolation.

### 2. Route-Based Pollution Exposure

A shorter route is not necessarily the route with the lowest pollution exposure.

Delhi Breath Budget compares alternative journeys by considering route duration and estimated pollution conditions along the route.

The intended route-analysis workflow includes:

- Selecting an origin and destination.
- Retrieving alternative route geometries.
- Sampling pollution conditions along route segments.
- Estimating average PM2.5 exposure.
- Accounting for travel duration.
- Calculating a cigarette-equivalent exposure illustration.
- Ranking routes to help users compare alternatives.

The aim is to help commuters and delivery riders consider both travel time and environmental exposure when planning a journey.

### 3. Cigarette-Equivalent Exposure

AQI and PM2.5 concentrations can be difficult to interpret without environmental-health context.

Delhi Breath Budget uses a cigarette-equivalent illustration to communicate pollution exposure in a more familiar format.

The project's reference rule of thumb is:

`Cigarette equivalent = Average PM2.5 concentration over 24 hours / 22`

The route-level estimate is adjusted for travel duration.

This is an illustrative communication technique, not a medical measurement or a claim that air pollution and cigarette smoking have identical health effects.

### 4. Fire Hotspots and Smoke-Risk Context

Regional fire activity can contribute to air pollution, particularly during the stubble-burning season.

The platform incorporates fire-hotspot information and wind context to help users explore possible relationships between regional fires and Delhi-NCR pollution.

The intended analysis includes:

- Geographic visualization of fire detections.
- Fire-location and detection metadata.
- Wind speed and direction.
- Estimated smoke-arrival timing.
- A summary of potential regional smoke risk.
- Confidence and uncertainty indicators.

Smoke-arrival estimates should be interpreted as likelihood estimates rather than precise predictions.

### 5. Wind Visualization

Wind direction and speed are important factors when interpreting the possible movement of smoke and other airborne pollutants.

The interactive map uses wind indicators to help users understand the direction of air movement and its potential relevance to nearby pollution events.

### 6. Personalized Outdoor Guidance

Different users may need different environmental guidance.

Delhi Breath Budget supports profile concepts for:

- Adults.
- Children.
- Older adults.
- Asthma-sensitive individuals.
- Outdoor workers.

Activity context can include:

- Walking.
- Running.
- Cycling.
- Commuting.

Personalized guidance is intended to consider the selected profile, activity, and available environmental information.

### 7. Safe Outdoor Window

The safe-window feature is designed to help users identify potentially better times for outdoor activities.

The intended workflow includes:

- Selecting a location.
- Choosing a user profile and activity.
- Examining hourly environmental-risk estimates.
- Exploring forecasts for up to 48 hours.
- Identifying a potentially lower-risk time window.
- Presenting a clear recommendation with supporting context.

The result is a planning aid, not a guarantee that outdoor conditions are safe.

### 8. AI-Assisted Environmental Advice

The advice layer translates environmental results into concise, actionable explanations.

Its intended responsibilities include:

- Summarizing relevant air-quality conditions.
- Explaining route-exposure comparisons.
- Communicating possible fire and wind risks.
- Providing profile-aware recommendations.
- Suggesting practical actions based on computed results.
- Using template-based fallback responses when an AI provider is unavailable.

Advice should rely on the supplied environmental data rather than inventing measurements or presenting uncertain predictions as facts.

### 9. Environmental Alerts

The notification workflow is designed to use Telegram to communicate relevant changes.

Alert scenarios include:

- Air-quality levels crossing configured thresholds.
- Increased estimated smoke risk.
- Relevant changes in outdoor-risk conditions.
- Safe-window or advice updates.

Notifications should include timestamps, avoid repeated unnecessary alerts, and clearly communicate uncertainty.

---

## What Makes Delhi Breath Budget Different?

Route planning based on air quality is already an established concept. Our approach combines several complementary capabilities in a single user experience.

| Capability                    | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Cigarette-equivalent exposure | Makes pollution exposure easier to communicate                 |
| Fire and wind context         | Helps users explore possible regional smoke influences         |
| Personalized guidance         | Adapts recommendations to user profiles and activities         |
| Safe-window estimation        | Helps users plan outdoor activities around changing conditions |
| Route exposure comparison     | Adds environmental exposure to everyday journey planning       |
| Environmental alerts          | Helps users respond to relevant changes                        |

The goal is not simply to display pollution data, but to make that data more actionable.

---

## Target Users

### Commuters and Delivery Riders

Compare possible journeys and consider estimated pollution exposure alongside travel time.

### Parents and Schools

Use environmental context when planning outdoor activities, sports, and assemblies.

### Asthma-Sensitive Individuals and Older Adults

Explore profile-aware guidance and environmental conditions relevant to outdoor planning.

### Outdoor Workers

Understand pollution conditions during periods of extended outdoor exposure.

### Delhi-NCR Residents

Explore regional fire activity, wind conditions, and changing air-quality patterns, particularly during the stubble-burning season.

---

## Technology Stack

The project architecture uses the following technologies and planned integrations.

| Component        | Technology                          | Purpose                                 |
| ---------------- | ----------------------------------- | --------------------------------------- |
| Frontend         | Next.js                             | Web application                         |
| UI framework     | React                               | Component-based interface               |
| Language         | TypeScript                          | Type-safe frontend development          |
| Styling          | CSS and frontend components         | Responsive layouts and visual design    |
| Backend          | Python                              | Application and data-processing logic   |
| API framework.   | FastAPI                             | Backend API endpoints                   |
| API contract     | OpenAPI                             | Shared API specifications               |
| Database         | PostgreSQL with PostGIS             | Environmental and spatial data storage  |
| Air quality      | OpenAQ / CPCB fallback              | Air-quality observations                |
| Weather and wind | Open-Meteo                          | Weather and forecast information        |
| Fire hotspots    | NASA FIRMS                          | Satellite fire detections               |
| Routing          | OpenRouteService / OSRM             | Route geometry                          |
| Database hosting | Supabase                            | PostgreSQL hosting                      |
| Frontend hosting | Vercel                              | Public web deployment                   |
| Scheduled jobs   | GitHub Actions                      | Automated ingestion scheduling          |
| AI advice        | LLM provider with template fallback | Natural-language environmental guidance |
| Notifications    | Telegram Bot API                    | Environmental alerts                    |

The exact providers and integrations enabled in a particular deployment are determined by the repository configuration.

---

## System Architecture

Delhi Breath Budget follows a modular architecture that separates data ingestion, environmental calculations, API services, and the user interface.

```text
                 ENVIRONMENTAL DATA SOURCES
              ┌──────────┬───────────┬──────────┐
              │  OpenAQ  │ Open-Meteo│ NASA     │
              │  / CPCB  │           │ FIRMS    │
              └────┬─────┴─────┬─────┴────┬─────┘
                   │           │          │
                   └───────────┼──────────┘
                               │
                               ▼
                    DATA INGESTION LAYER
                  Validation and timestamps
                               │
                               ▼
                    PostgreSQL + PostGIS
                               │
                               ▼
                     ENVIRONMENT ENGINE
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         AQI Grid        Fire/Wind Risk     Route Scoring
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                        FASTAPI BACKEND
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         Safe Window       AI Advice       Alerts
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                       NEXT.JS FRONTEND
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          Live Map       Route Planner     User Guidance
```

This architecture is designed to support modular development, independent testing, and integration between the data, engine, advice, and frontend components.

---

## Project Structure

```text
delhi-breath-budget/
├── .github/
│   └── workflows/          # Automation workflows
├── advice/                 # Advice and notification modules
├── contracts/
│   ├── examples/           # Example API payloads
│   └── openapi.yaml        # API contract
├── database/               # Database schema and migrations
├── deployment/             # Deployment configuration
├── engine/
│   ├── app/                # FastAPI application
│   └── tests/              # Engine tests
├── ingest/                 # Environmental data ingestion
├── web/                    # Next.js frontend
├── .env.example            # Environment variable template
├── LICENSE
├── Makefile
└── README.md
```

---

## Application Workflow

The intended user journey is:

1. Open the Delhi Breath Budget web application.
2. Explore the air-quality map.
3. Select a user profile and activity.
4. Examine available fire-hotspot and wind information.
5. Select an origin and destination.
6. Compare available routes using estimated pollution exposure.
7. Explore the safe-window forecast.
8. Review personalized environmental advice.
9. Receive relevant alerts when the notification service is enabled.

The experience is designed to help users move from environmental observations to informed planning decisions.

---

## API Documentation

The shared API contract is maintained in:

`contracts/openapi.yaml`

| Endpoint           | Method | Description                                     |
| ------------------ | ------ | ----------------------------------------------- |
| `/health`          | GET    | API health and data-freshness information       |
| `/api/aqi-grid`.   | GET    | Air-quality grid points and confidence metadata |
| `/api/fires`       | GET    | Fire hotspots and smoke-risk summary            |
| `/api/wind`        | GET    | Wind vectors for map visualization              |
| `/api/routes`      | POST   | Alternative routes and exposure-ranking results |
| `/api/safe-window` | POST   | Profile-aware hourly risk estimates             |
| `/api/advice`      | POST   | Environmental advice based on supplied results  |

### Example Profile Object

```json
{
  "type": "adult",
  "activity": "commute"
}
```

Supported profile types:

- `adult`
- `child`
- `elderly`
- `asthma`
- `outdoor_worker`

Supported activities:

- `walk`
- `run`
- `bike`
- `commute`

For exact request and response formats, refer to the shared OpenAPI contract and the example payloads in the repository.

---

## Getting Started

### Prerequisites

Install the following tools before running the application:

- Git
- Node.js and npm
- Python 3.11 or a version supported by the project
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone https://github.com/AyushMourya43/delhi-breath-budget.git
cd delhi-breath-budget
```

### 2. Set Up the Backend

Create a Python virtual environment from the repository root.

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r engine/requirements.txt
```

**Windows PowerShell**

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r engine/requirements.txt
```

Start the API:

```bash
python -m uvicorn engine.app.main:app --reload --port 8000
```

Backend URLs:

- Health check: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd web
npm ci
```

Create the local environment file.

**macOS / Linux**

```bash
cp .env.example .env.local
```

**Windows PowerShell**

```powershell
Copy-Item .env.example .env.local
```

Configure the frontend to use the local backend:

```dotenv
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api
```

If you want to use the frontend's mock responses, configure:

```dotenv
NEXT_PUBLIC_USE_MOCK=true
```

Start the frontend:

```bash
npm run dev
```

Open the local application at:

http://localhost:3000

If Next.js selects a different port, use the URL shown in the terminal.

---

## Environment Configuration

The root `.env.example` file documents the environment variables used by the project.

Depending on the enabled integrations, configuration may include:

- Database connection details.
- Air-quality API credentials.
- NASA FIRMS credentials.
- Routing service configuration.
- AI provider API keys.
- Telegram bot configuration.
- Backend and frontend API URLs.

### Security Guidelines

- Never commit `.env` or `.env.local` files.
- Never publish database passwords, API keys, bot tokens, or service-role keys.
- Store deployment secrets in the hosting provider's environment-variable settings.
- Do not expose private credentials through variables prefixed with `NEXT_PUBLIC_`.
- Keep `.env.example` limited to variable names and safe placeholder values.

---

## Running the Application

To run the complete application locally:

1. Start the backend API in one terminal.
2. Start the Next.js frontend in a second terminal.
3. Open the local frontend URL in your browser.
4. Verify that the frontend API configuration points to the backend you started.
5. Confirm that required environment variables are configured for the features you want to test.

If a provider or database is not configured, the corresponding functionality may be unavailable or may use demonstration data.

---

## Testing

Run the tests and checks defined by the current repository before submitting changes.

### Backend Tests

From the repository root:

```bash
python -m pytest -q engine/tests ingest/tests advice/tests
```

### Frontend Checks

```bash
cd web
npm run lint
npm run build
```

Run frontend tests if a test script is configured in `web/package.json`.

### Manual Verification

Before considering a release ready, verify:

- The map loads correctly.
- Air-quality, fire, and wind layers behave as expected.
- Route comparisons return valid results.
- Exposure scores are consistent with the underlying calculations.
- Safe-window recommendations respond to profile selection.
- Advice uses the provided environmental results.
- Loading, empty, and error states are understandable.
- The application works on mobile screens.
- The deployed application handles unavailable data and API failures gracefully.

---

## Development Roadmap

Delhi Breath Budget follows a six-phase development plan.

- [x] **Phase 1 — Setup and Contracts:** repository structure, shared API definitions, and development environment.
- [x] **Phase 2 — Data Foundation:** environmental data ingestion, validation, and storage.
- [x] **Phase 3 — Core Engine:** air-quality interpolation, fire/wind analysis, route scoring, and safe-window calculations.
- [x] **Phase 4 — UI and Advice Layer:** interactive map, route comparisons, safe-window interface, and personalized advice.
- [x] **Phase 5 — Integration and Demo Experience:** time-based visualization, smoke-risk context, alerts, and confidence indicators.
- [x] **Phase 6 — Polish, Testing, and Pitch:** deployment, usability improvements, testing, and demonstration preparation.

---

## Data Sources

The project architecture uses or is designed to integrate with the following services.

### OpenAQ

Air-quality observations from monitoring stations.

Website: https://openaq.org/

### Central Pollution Control Board (CPCB)

Indian air-quality information and a potential fallback/reference source.

Website: https://cpcb.nic.in/

### Open-Meteo

Weather conditions, wind information, and forecasts.

Website: https://open-meteo.com/

### NASA FIRMS

Satellite-based fire and thermal-anomaly detections.

Website: https://firms.modaps.eosdis.nasa.gov/

### OpenRouteService

Route geometry for journey comparison.

Website: https://openrouteservice.org/

### OSRM

An alternative routing engine.

Website: https://project-osrm.org/

### Supabase

PostgreSQL hosting and spatial-data capabilities through PostGIS.

Website: https://supabase.com/

### Vercel

Frontend deployment and hosting.

Website: https://vercel.com/

---

## Accuracy, Safety, and Limitations

Delhi Breath Budget is intended for environmental awareness and planning.

- Air-quality values can vary by location, time, and monitoring source.
- Interpolated pollution values are estimates between monitoring stations, not direct measurements.
- Fire detections may be delayed, missed, or affected by false positives.
- Wind-based smoke estimates are uncertain and should not be interpreted as guaranteed arrival times.
- Cigarette-equivalent exposure is an illustrative comparison, not a clinical measurement.
- Safe-window estimates do not guarantee safe conditions for outdoor activity.
- API outages, missing observations, and data freshness can affect results.
- Environmental advice should not replace official government advisories or professional medical guidance.

Where possible, the application should display source timestamps, confidence information, and clear labels for estimates or demonstration data.

---

## Future Scope

Potential extensions include:

- More detailed spatial pollution forecasts.
- Improved smoke-arrival estimation.
- Historical air-quality analysis.
- Additional personalization options.
- Improved confidence and uncertainty visualization.
- More sophisticated route-exposure models.
- Expanded alert preferences and notification channels.
- School and institutional environmental-planning tools.
- Additional data sources and improved fallback mechanisms.

---

## Team

Delhi Breath Budget was designed around a four-person development workflow.

| Role              | Responsibilities                                                   |
| ----------------- | ------------------------------------------------------------------ |
| Data Engineering  | Ingestion, database, validation, and data freshness                |
| Core Engine       | Interpolation, smoke-risk logic, route scoring, and APIs           |
| Frontend / UI     | Interactive map, dashboard, responsive design, and visualization   |
| Advice and Alerts | Environmental advice, notification workflows, and demo preparation |

---

## License

See the [`LICENSE`](LICENSE) file in the repository for licensing terms.

---

## Try Delhi Breath Budget

Explore the application:

**Live Application:** https://delhi-breath-budget.vercel.app/

**GitHub Repository:** https://github.com/AyushMourya43/delhi-breath-budget

Delhi Breath Budget aims to make air pollution easier to understand and environmental decisions more informed—one journey, one forecast, and one decision at a time.
