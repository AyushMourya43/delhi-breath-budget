# Engine API

Run from the repository root after installing `engine/requirements.txt`:

```sh
uvicorn engine.app.main:app --reload --port 8000
```

The interactive contract is at `http://localhost:8000/docs`; health is at
`http://localhost:8000/health`. The current service is a contract-complete
demo implementation: every environmental payload is explicitly marked
`is_demo: true`. It does not connect to Supabase, provider APIs, OpenRouteService,
or Open-Meteo yet.

Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins
when deploying. Do not use `*` with credentials or remove demo labels until
real source data, freshness checks, and failure handling have been connected.