# UPSC PYQ Study App

## Vercel deployment

The repository root is the Vercel project root. [`pyproject.toml`](pyproject.toml) points Vercel's FastAPI runtime at the backend and builds the Vite frontend; static assets are served through Vercel's CDN, and API routes remain on the same origin.

1. In Vercel, import `https://github.com/sure072244-lang/UPSC-` and keep the project root set to `.`.
2. Use the FastAPI framework preset if available (otherwise `Other`). Leave the dashboard Build Command, Output Directory, and Install Command overrides blank. `pyproject.toml` builds the Vite frontend and FastAPI serves its assets from the CDN; do not set `frontend/dist` as a standalone Output Directory, which can deploy only the static site and omit API routes.
3. Add MongoDB Atlas or another persistent MongoDB provider. Set `MONGO_URL` and `DB_NAME` in Vercel Environment Variables.
4. AppLock is disabled by default. To enable the device passkey lock, set `APP_LOCK_ENABLED=true` in Vercel Variables and redeploy; the first Redmi Pad SE passkey becomes the owner credential.
5. Add `MISTRAL_API_KEY` for Professor AI/OMR; `NOTION_TOKEN` and `NOTION_DATABASE_ID` are optional. Use [`backend/.env.example`](backend/.env.example) as the variable checklist. Do not commit real `.env` files.
6. Deploy and open the new URL. With AppLock disabled, anyone who can access the public URL can read and change the tracker data; do not store sensitive information in this deployment.

Vercel does not provide persistent local disk storage, so MongoDB must be external. The browser device ID is a stable browser identity, not Android hardware attestation; keep the passcode private and use the first-device approval flow.

The public `/api/diagnostics/data` endpoint reports PYQ, question-text, and official-paper-link counts plus whether MongoDB and Notion variables are present. It never returns secret values. The login page shows the same summary so missing Vercel variables or bundled datasets are visible immediately.

## Research and data coverage

The active app bundles its runtime data under `backend/data`, so the same datasets are available to Railway and Vercel functions:

- Prelims master: 1,300 classified questions for 2014–2026, with a separate 1,300-row source trail and official paper links.
- Enriched question text: 1,198 active-ID matches marked `FULL_TEXT`, 100 marked `TOPIC_TITLE_ONLY`, and 2 active IDs without a research-text match. The detail API serves wording only for `FULL_TEXT` rows; use the official paper link for the rest.
- Prelims analytics: subject-by-year counts and 174 subtopic-recurrence rows.
- Post-2026 research: 6 public quiz signals, 17 source-registry entries, 7 mock-ecosystem providers, 7 external calibration rows, 6 evidence rules and 5 study-engine implications.
- Mains research: 60 topic rows across GS-I–IV and 2013–2026. These values were transcribed from supplied screenshots, are not independently verified, and can overlap across composite topic labels; they are research signals, not official UPSC weightage.
- Subject taxonomy: 23 labels across Prelims, Mains and cross-cutting areas. The supplied files contain only a `Philosophy Optional` label, not full topic-by-topic optional syllabi.
- 2027 planning schedule: 46 mock-test records from a supplied workbook; this is a study plan, not an official UPSC timetable.

The Research page is available at `/research` and the source-aware aggregate at `/api/research/dashboard`. The older 230-file `research/Webbapp` archive remains in GitHub but is deliberately excluded from Vercel's deployment bundle; its selected structured datasets are copied into `backend/data/research` for the active app. The bundle does not fabricate missing optional-syllabus or setter-source data.

## Railway deployment

This repository contains the UPSC PYQ study app: React/Vite frontend, FastAPI backend, PYQ datasets, and research archive. Railway deploys it as one service: the Docker build compiles the frontend and FastAPI serves it with `/api` on the same origin.

1. Create a Railway project and deploy this repository.
2. Add MongoDB or use an external MongoDB provider. Set `MONGO_URL` to its connection URI and `DB_NAME` to the database name.
3. AppLock is disabled by default. To enable it, set both `APP_LOCK_ENABLED=true` and `VITE_APP_LOCK_ENABLED=true`, then also set `APP_PIN` and a unique `APP_SECRET` of at least 32 characters.
4. Set `APP_URL` to the Railway public domain and `CORS_ORIGINS` to that same origin. Add `MISTRAL_API_KEY` to enable Professor AI and OMR vision. `NOTION_TOKEN` and `NOTION_DATABASE_ID` are optional for Notion sync.
5. Use [`backend/.env.example`](backend/.env.example) as the variable checklist, but enter values in Railway's Variables panel. Never upload a real `.env` file.

Railway detects the root `Dockerfile`, uses the platform `PORT`, and checks `/api/` for health. No local `.env` file is required or included in the deployment image. Configure a persistent external MongoDB service before using the app; the container filesystem is ephemeral.

The study app includes a React/Vite frontend, FastAPI/MongoDB backend, optional
AppLock, study tracking, PYQ practice, spaced revision, mock tests, analytics, optional
AI/OMR, and Notion sync.

## Layout

```
upsc-pyq-study-app/
  backend/   FastAPI + motor (async MongoDB) + Pydantic v2 — python, /root/.venv
  frontend/  Vite + React 19 + Tailwind v4 + shadcn/ui (TypeScript strict)
  tests/     Playwright e2e workspace (pre-scaffolded)
```

## Running

Two separate processes, managed by supervisor in the pod (see "Pod conventions"
below); to run them by hand from two terminals instead:

```bash
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload   # http://localhost:8001
cd frontend && yarn dev                                                # http://localhost:3000
```

## The `/api` proxy convention

Every backend route lives under `/api` (the backend mounts one
`APIRouter(prefix="/api")`), and the frontend dev server
(`frontend/vite.config.ts`) proxies `/api/*` to `http://localhost:8001`. So
frontend code always calls a **relative** path — `apiGet("/status")` →
`/api/status` — and never an absolute backend URL. The same code works in dev
(via the Vite proxy) and in production (once both are served behind a single
origin).

## Backend

FastAPI, async throughout. `python` is the app venv interpreter
(`/root/.venv/bin/python`); backend deps are pip-installed from
`backend/requirements.txt`.

- **Entry point**: `backend/server.py` — creates `app = FastAPI()`, creates
  `api_router = APIRouter(prefix="/api")`, registers routes **on the router**,
  and calls `app.include_router(api_router)` at the bottom. CORS middleware is
  added from `CORS_ORIGINS`. Never hang a route directly off `app` — it would
  land outside `/api` and the Vite proxy would not reach it.
- **The route pattern** (copy `status` in `server.py`):
  1. a Pydantic model per request body and per response
     (`StatusCheckCreate` / `StatusCheck`);
  2. an `async def` handler decorated with
     `@api_router.post("/status", response_model=StatusCheck)`;
  3. `await` the motor call inside it.
  FastAPI validates the request against the Pydantic model before your handler
  runs — a malformed body never reaches your code, it gets an automatic `422`
  with a `{"detail": [...]}` body.
- **Growing the backend**: as `server.py` gets crowded, move models to
  `backend/models/` and routers to `backend/routers/` (one module per resource,
  each exporting its own `APIRouter`, mounted from `server.py` via
  `api_router.include_router(...)` or `app.include_router(...)` with the `/api`
  prefix preserved).
- **MongoDB**: import the shared handle — `from lib.db import client, db`
  (`backend/lib/db.py` self-loads `.env` before reading env). Use it from
  `server.py`, every router, and standalone scripts like `seed.py`; never
  construct another `AsyncIOMotorClient`. Collections are attributes:
  `await db.status_checks.insert_one(...)`, `await db.status_checks.find().to_list(1000)`.
  Motor connects lazily, so importing `server` never blocks on Mongo. `pymongo`
  is installed too if you need a sync client in a script.
- **Ids**: documents use a string `id` (`uuid4`) field, not Mongo's `ObjectId`
  — `ObjectId` is not JSON-serializable and leaks into response bodies. Keep the
  `uuid4` default-factory pattern from `StatusCheck`.
- **Config**: `backend/.env` — `MONGO_URL` (connection string), `DB_NAME`
  (database name), `CORS_ORIGINS`. `server.py` loads it with `python-dotenv`
  above its local imports, and `lib/db.py` self-loads it so standalone scripts
  inherit it too. The pod runs `mongod` locally, so `MONGO_URL` points at
  `localhost`. Add new secrets/config here; read them with `os.environ`.
- **Dates**: `backend/lib/dates.py` — `today_iso(tz=None)`. The pod clock is
  UTC; anchor "today" server-side with this, never with client-side date math.
- **Interactive check**: `cd /app/backend && python -c 'import server'` catches
  syntax/import errors without waiting for the supervisor log.

## Frontend

- Vite + React 19 + TypeScript strict, dev server on port `3000`.
- Tailwind CSS v4 (via the `@tailwindcss/vite` plugin — no separate
  `tailwind.config.js` needed) + shadcn/ui, initialized with the `base-nova`
  style and `neutral` base color, `@` path alias (`@/*` → `src/*`) wired in both
  `tsconfig.app.json`/`tsconfig.json` and `vite.config.ts`.
- `react-router-dom` and `motion` are preinstalled — don't re-add them. `src/App.tsx`
  is the `<Routes>` table and nothing else; screens live in `src/pages/*.tsx` and are
  imported as `@/pages/<Name>`. `src/pages/Home.tsx` ships as the worked example. Add
  a `<Route>` for every page you write, in the same edit that creates the page — a
  page with no route is unreachable, and any URL without a matching `<Route>` renders a
  **blank page** — `<Routes>` matches nothing and mounts nothing.
- Components installed under `src/components/ui/`: button, card, input, label,
  select, dialog, sheet, tabs, badge, calendar, sonner, textarea, table, popover,
  dropdown-menu, checkbox. Add more with `npx shadcn@latest add <component>`.
- `src/lib/api.ts` — the typed fetch layer: `apiGet<T>`, `apiPost<T>`,
  `apiPut<T>`, `apiPatch<T>`, `apiDelete<T>`, all relative to base `/api`,
  throwing `ApiError` (with `status` and the parsed body) on any non-2xx.
  **Nothing infers across the Python boundary** — you declare the response type
  yourself as a TS interface mirroring the endpoint's Pydantic model, and keeping
  the two in sync is a manual discipline. When you change a Pydantic model,
  change its TS interface in the same edit.
- `src/pages/Home.tsx` is a minimal example of the wiring: TanStack Query's `useQuery`
  with `apiGet<StatusCheck[]>("/status")` as the `queryFn`. It is a **non-blocking
  connectivity probe**, not a proof of the round trip — the result is deliberately
  discarded so the splash renders identically with no backend. `apiGet<T>` does no
  runtime validation either; `T` is your assertion, not a check. See the
  static-preview rule in `TEMPLATE.md` §4 for why no page may be gated on a fetch.

## TypeScript

`frontend/tsconfig.app.json` / `tsconfig.node.json` have `strict: true`. In the
pod:

```bash
cd frontend && yarn typecheck
```

— plain `tsc --noEmit` run from `frontend/` checks ZERO files (root tsconfig uses
project references with `"files": []`) and exits 0 even with type errors. Always
use `-b` for the frontend. Lint with `cd frontend && yarn lint` (oxlint).

## Data fetching

TanStack Query is wired: `QueryClientProvider` in `src/main.tsx`, `useQuery` demo
in `src/pages/Home.tsx` (see above). Use `useQuery`/`useMutation`, not
fetch-in-`useEffect`.

## Completion gate (tier 1)

When the build is complete, run tier 1 once, all in the same turn: a curl smoke
over the key `/api` endpoints (assert status AND a response field, plus one
negative case), `cd frontend && yarn typecheck`, and ONE happy-path browser pass
through the core user journey. Clean on all three → finish; any failure is a real
bug — fix it, re-run the failed check, and escalate to the testing subagent.
No routine typecheck/lint/smoke passes during the build — tier 1 runs exactly once.


## Testing

Two lanes.

**Backend (pytest)** — specs in `backend/tests/` as `test_*.py`, run with:

```bash
cd /app/backend && pytest
```

`backend/pytest.ini` is canonical: `addopts = -n 2 --dist loadscope` (pytest-xdist,
already parallel — do not pass your own `-n`) and `asyncio_mode = auto` (so
`async def test_...` needs no marker). Serial is `-n 0`, **never**
`-p no:xdist` (that errors, because `addopts` still passes `-n`/`--dist`).
`backend/tests/conftest.py` is pre-scaffolded — a sync `client` fixture
(`httpx.Client` rooted at `/api`), an async `aclient`, and an `api_url()` helper,
all pointed at `BACKEND_URL` (default `http://localhost:8001`). Tests hit the
live uvicorn process, so the app under test is the one the browser sees. Add
app-specific fixtures below the marker; do not re-create the file.

**Frontend (Playwright)** — `/app/tests/` is pre-scaffolded:
`playwright.config.ts` (canonical — edit the marked lines only),
`fixtures/helpers.ts`, and a `package.json` that resolves
`@playwright/test@1.62.0` (node_modules baked into the image). Write specs into
`tests/e2e/`. Do NOT re-create the config/helpers or install/upgrade playwright —
matching Chromium browsers live at `/pw-browsers`.

The backend lane is pytest: this template's backend is Python, so `vitest` does
not apply to it.

## Pod conventions

This template runs under supervisord in the Emergent agent pod — supersedes any
local-run instructions above.

- Backend, frontend, and `mongod` are each a supervisor program. After code or
  config changes, restart and wait for readiness:

  ```bash
  sudo supervisorctl restart frontend backend
  until curl -sf -o /dev/null http://localhost:3000; do sleep 2; done
  ```

- Status, only after a restart you triggered:
  `sudo supervisorctl status frontend backend`. Logs:
  `/var/log/supervisor/backend.err.log`, `backend.out.log`,
  `frontend.err.log`.
- App in a browser: the pod's preview URL (frontend, port `3000`). Backend API
  directly at port `8001`.
- `mongod` runs locally in the pod (`--bind_ip_all`); `MONGO_URL` in
  `backend/.env` points at `localhost`, no separate Mongo container.
- Both dev servers hot-reload on file edits (uvicorn `--reload` for the backend,
  Vite HMR for the frontend); no rebuild step needed for normal iteration. A
  restart is still needed after changing `.env`, `requirements.txt`, or
  `vite.config.ts`.
