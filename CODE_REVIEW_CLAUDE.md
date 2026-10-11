# TimeTrkr — Code & Architecture Review

_Reviewed: 2026-10-11, at commit `75bc1c8` (main)._

## Summary

TimeTrkr is small (about 1,000 lines of Python and 4,500 of Vue/JS), the scope is easy to follow, and the core flow works. The backend is the better half: its routes are scoped per user, its validation is shared through Pydantic, and the new API-token feature is well designed and well tested. The frontend shows signs of AI-assisted iteration: a refactor was started and abandoned, so the store, validation and date logic each exist in several copies. Debug logging was left in, and one view has grown to 1,700 lines.

The biggest problems are security and deployment, not code style:

1. **The JWT signing key is hardcoded in git.** Anyone with the source can mint a token for any user on any deployed instance.
2. **The frontend saves the user's plaintext password in `localStorage`** and never uses it again.
3. **A fresh Docker/K8s deploy cannot create its database tables.** Alembic isn't a declared dependency and nothing runs migrations.

Fix those three first (all small changes). After that, the main architectural improvement is moving date filtering and aggregation to the server, so the frontend stops downloading every entry the user has ever logged on each page load.

### Checks I ran

| Check | Result |
|---|---|
| `pytest` | 13 passed, 25 deprecation warnings |
| `eslint .` | **8 errors, 97 warnings** (mostly `console.*`; the errors are unused args in `vite.config.js`) |
| `vite build` | OK. AnalysisView chunk 186 kB, HistoryView 94 kB |
| CSV export → re-import | **DONE** in `68ba67f`; round-trip regression test passes, see B1 |
| `GET /time-entries` (no trailing slash) | **Returns `200 text/html`** (the SPA), see B3 |

---

## What's good

- **User isolation is correct.** Every time-entry query filters on `user_id` ([crud.py:48-55](app/crud.py#L48-L55)), so a user cannot read or modify another user's entries by ID.
- **The API-token design is solid.** Only a SHA-256 hash is stored, the `ttk_` prefix routes auth, the plaintext is shown once, and token management requires a real login session ([routers/api_tokens.py:10-11](app/routers/api_tokens.py#L10-L11)). The tests cover revocation, other users' tokens, and tokens trying to manage tokens.
- **The test fixture is clean.** `conftest.py` uses in-memory SQLite with `StaticPool` and dependency overrides, which is the right pattern and easy to extend.
- **Validation lives in Pydantic** ([schemas.py:6-48](app/schemas.py#L6-L48)), so the API rejects bad data whatever the client.
- **Alembic is set up** with real migrations rather than `create_all()`.
- Routes are lazy-loaded, dark mode follows the system default, and the 5-minute increment UX is thoughtful.

---

## 1. Security (fix now)

### S1. Hardcoded JWT secret — Critical
[app/auth.py:16](app/auth.py#L16)

```python
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
```

This is the key from the FastAPI tutorial, and it is committed to git. With it, anyone can sign `{"sub": "<any username>"}` and act as that user. The CI publishes images on every push to `main`, so any running instance is exposed.

**Fix:** read it from the environment and refuse to start without it (`os.environ["JWT_SECRET"]` or `pydantic-settings`). Add a K8s `Secret`. Rotating the key logs out every existing session, which is fine here.

### S2. Plaintext password stored in localStorage — Critical
[frontend/src/stores/auth.js:33-35](frontend/src/stores/auth.js#L33-L35)

```js
// Save credentials for session restoration (optional)
localStorage.setItem('username', credentials.username)
localStorage.setItem('password', credentials.password)
```

Nothing in the Vue app ever reads this back. It is left over from the legacy `static/app.js` ([static/app.js:124-125](static/app.js#L124-L125)). Any XSS bug, browser extension, or person at the machine can read the raw password, which people often reuse elsewhere.

**Fix:** delete those two lines. On the next load, run `localStorage.removeItem('password')` once to clean up existing browsers.

### S3. Open registration with no constraints — High (for any public deployment)
[app/routers/users.py:11](app/routers/users.py#L11), [app/schemas.py:80-81](app/schemas.py#L80-L81)

Anyone who can reach the server can create an account. Username and password have no length or format rules: `{"username": "", "password": ""}` succeeds. There is also no rate limiting on `/token`.

**Fix:** if this is a personal or small-team tool, put registration behind a flag (`ALLOW_REGISTRATION=false`) or an invite. In all cases, add `Field(min_length=...)` constraints. Consider `slowapi` or ingress-level rate limiting on `/token`.

### S4. CORS is `*` — Low
[app/main.py:20-38](app/main.py#L20-L38)

`"*"` is in the list next to the localhost origins, which makes the localhost entries pointless. Auth uses bearer tokens rather than cookies, so the real risk is low. Still, production is same-origin and needs no CORS at all. Enable it only in dev, from config.

### S5. Session handling is loose — Low
- The router guard only checks that a token exists ([router/index.js:34](frontend/src/router/index.js#L34)). `tokenExpiry` is written but never read, so an expired token shows the app shell until the first API call returns 401.
- Logout is client-side only. A copied JWT stays valid for 7 days, and there is no way to revoke JWTs.
- `passlib` is unmaintained and logs a traceback with `bcrypt` ≥ 4.1 (`error reading bcrypt version`). Use `bcrypt` directly or `pwdlib`.

---

## 2. Bugs (verified)

### B1. CSV export can't be re-imported — DONE

**DONE:** Fixed in commit `68ba67f`. Shared CSV utilities normalize headers and API times with seconds, and use Papa Parse for quoted fields, embedded commas, escaped quotes, and line breaks. Five regression tests and the production build pass. Duplicate detection remains unresolved and was outside this fix. The original finding below is retained for context.

The import fails twice over:
1. Headers: export writes `Start Time`/`End Time`. Import strips the space from the *expected* name (`starttime`) but not from the actual header (`start time`), so it reports "Missing required columns" ([HistoryView.vue:381-383](frontend/src/views/HistoryView.vue#L381-L383)).
2. Times: once the headers are fixed, every row still fails. The API serializes times as `"09:00:00"` and export writes them as-is ([HistoryView.vue:318](frontend/src/views/HistoryView.vue#L318)), but import requires `^\d{2}:\d{2}$` ([HistoryView.vue:426-428](frontend/src/views/HistoryView.vue#L426-L428)).

Import also doesn't detect duplicates, so importing the same file twice doubles your hours. The CSV parser is a hand-rolled `split(',')`, which breaks on quoted commas.

### B2. Import is O(n) full reloads and overwrites the dashboard form
[HistoryView.vue:475-493](frontend/src/views/HistoryView.vue#L475-L493). Each row:
1. writes into the dashboard's `currentEntry` form state, then
2. calls `saveTimeEntry()`, which calls `loadTimeEntries()`. That is 4 more requests, one of which downloads **every entry** the user has.

Importing 200 rows makes about 1,000 requests and downloads the entire history 200 times. Add a `POST /time-entries/bulk` endpoint that runs in a single transaction.

### B3. The SPA catch-all swallows API typos and missing slashes
[app/main.py:82-96](app/main.py#L82-L96). The `/{full_path:path}` route matches before FastAPI's trailing-slash redirect, so:

```
GET /time-entries   → 200 text/html  (the SPA, not the API)
GET /users/me       → 200 text/html
```

Now that API tokens invite scripted access, this matters: a script that leaves off the trailing slash gets HTML with a 200 and fails confusingly. **Fix:** see A1 (put the API under `/api`). At minimum, have the catch-all return 404 for anything that looks like an API path.

### B4. Edit modal can produce invalid times and hides errors
[EditTimeEntryModal.vue:200](frontend/src/components/EditTimeEntryModal.vue#L200) clamps to `23:59`, which isn't a 5-minute increment, so the server rejects it. The `catch` at [line 252](frontend/src/components/EditTimeEntryModal.vue#L252) only does `console.error`, so the user clicks Save and nothing happens. The modal also mutates its `entry` prop directly; ESLint's `vue/no-mutating-props` was turned off to allow this ([eslint.config.js:39](frontend/eslint.config.js#L39)).

### B5. Analysis week labels are off by one day west of UTC
[AnalysisView.vue:865-866](frontend/src/views/AnalysisView.vue#L865-L866) uses `new Date('2025-04-20')`, which parses as **UTC midnight**. In any US timezone, that is the previous evening locally, so `toLocaleDateString` labels the week "Apr 19 – Apr 25". The rest of that file deliberately parses dates at local noon to avoid exactly this, so the two halves of the file disagree.

Related heat-map issue — **DONE**: `buildTimeHeatMap` now samples half-open intervals and unions occupied blocks per calendar day, splitting overnight work at midnight and clipping to the selected range. Zero-duration entries contribute no activity; normalized intensity stays within 0–1. Regression tests cover adjacency, overlap/duplicates, zero duration, overnight wraparound, range boundaries, and year rollover. Weeks are still defined three ways: Monday to Sunday on the dashboard, "starting at whatever start date you picked" in Analysis, and comments in Analysis that say Sunday to Saturday.

### B6. A fresh container deploy has no tables
- `alembic` is not in `pyproject.toml` or `uv.lock`. It is installed in the local `.venv` by hand, so `uv sync --frozen` in the Dockerfile doesn't install it.
- Nothing runs `alembic upgrade head`, and the app never calls `create_all()`.

A new PVC therefore gives `no such table: users` on the first request. Add `alembic` to the dependencies and run migrations on startup (an entrypoint script or an init container).

### B7. Other deploy breakage
- **Docker `HEALTHCHECK` always fails:** it uses `curl`, which isn't in `python:3.12-slim` ([Dockerfile:45-46](Dockerfile#L45-L46)). Docker will mark the container unhealthy (K8s ignores it).
- **`DATABASE_URL` is set in K8s but ignored:** [database.py:5](app/database.py#L5) and [alembic.ini:66](alembic.ini#L66) both hardcode `sqlite:///./db/timetrkr.db`. It only works because the container's working directory is `/app`.
- **The ingress would break every route if enabled:** `rewrite-target: /` with path `/` ([k8s/ingress.yml:8](k8s/ingress.yml#L8)) rewrites every request to `/`. It is commented out in kustomization today, so it isn't live, but it will bite whoever turns it on. Delete the annotation.
- **`isProd` guesses from the port number** ([services/api.js:5-9](frontend/src/services/api.js#L5-L9)). Serving prod on `:8080` makes the app call `/api/...`, which doesn't exist in prod. Use `import.meta.env.PROD`, or better, A1.

### B8. Smaller UI bugs
- **"Edit Last Entry" disappears** when your last entry was in a previous week, because it only looks at `todayEntries` and `weekEntries` ([LastTimeEntryEdit.vue:143-158](frontend/src/components/LastTimeEntryEdit.vue#L143-L158)). It also reloads twice after saving ([lines 215-216](frontend/src/components/LastTimeEntryEdit.vue#L215-L216)): `updateTimeEntry` already reloads.
- **History creates a new `bootstrap.Modal` on every edit click** ([HistoryView.vue:272-274](frontend/src/views/HistoryView.vue#L272-L274)). Use `Modal.getOrCreateInstance`.
- **`importStatus` and `importError` are set but never rendered.** There is also an empty `watch` at [HistoryView.vue:521-526](frontend/src/views/HistoryView.vue#L521-L526).
- **Deleting from TodayTimePanel ignores failures.**
- **Positive `tabindex` values (1, 2, 10–24)** in [TimeEntryForm.vue](frontend/src/components/TimeEntryForm.vue) break natural keyboard order for the rest of the page.

---

## 3. Architecture

### A1. Put the API under `/api` — highest-leverage structural fix
Today API routes and SPA routes share one namespace. That causes:
- the catch-all problem in B3,
- the `isProd` port heuristic in B7,
- a Vite proxy that has to list `/api` (with a rewrite), `/token` and `/users` separately and will drift every time a router is added ([vite.config.js](frontend/vite.config.js)),
- a CLAUDE.md that says `/api` exists when it doesn't.

Mount every router under `APIRouter(prefix="/api")`, make the catch-all serve only non-`/api` paths, set axios `baseURL: '/api'` everywhere, and reduce the Vite proxy to one `/api` entry with no rewrite. Keep `/token` aliased for one release if existing API-token users depend on it.

### A2. Push filtering and aggregation to the server
Every screen currently downloads **all** entries and filters client-side:
- Dashboard: 4 sequential requests, one of them the full history, just to show this week ([stores/timeEntries.js:117](frontend/src/stores/timeEntries.js#L117)).
- Analysis: the full history, then bucketed in the browser ([AnalysisView.vue:802](frontend/src/views/AnalysisView.vue#L802)).
- Login: `/users/me` returns `User.time_entries`, so the **full history** is sent on every login and profile view ([schemas.py:86](app/schemas.py#L86)).

This is fine at 500 entries and visibly slow at 20,000. Proposal:
- `GET /api/time-entries?start=YYYY-MM-DD&end=YYYY-MM-DD` with a proper date range (replacing `month_filter LIKE '2025-04%'`, which only works because SQLite stores dates as text, [crud.py:43](app/crud.py#L43)), ordered by date and start time.
- `GET /api/stats/daily?start&end` → `[{date, minutes, count}]`. The dashboard and Analysis both use it, and week bucketing becomes a tiny client-side fold.
- Drop `time_entries` from the `User` response schema.
- Add an index on `(user_id, date)`. CLAUDE.md says one exists; it doesn't.

This also leaves duration math in one place. Today it is written out separately in [crud.py](app/crud.py#L111-L121), [utils/timeUtils.js](frontend/src/utils/timeUtils.js#L11-L19), [stores/timeEntries.js](frontend/src/stores/timeEntries.js#L183-L188), [AnalysisView.vue](frontend/src/views/AnalysisView.vue#L836-L847) and [static/app.js](static/app.js).

### A3. Frontend state: finish or revert the half-done refactor
There are two parallel state layers:

| Used by the app | Dead (imported by nothing reachable) |
|---|---|
| `stores/timeEntries.js` (494-line store holding form state, fetching, validation, sorting and UI expand/collapse state) | `stores/timeEntryData.js`, `stores/timeEntryForm.js`, `composables/useTimeEntries.js`, `utils/validation.js` |

The dead set is a cleaner design that was never wired in. Each piece of logic exists in two or three copies (`getLocalDateString`, `getCurrentWeekRange`, `validateEntry`, `adjustTime`, round-to-5-minutes). That is why fixes like "update end time on start change" had to be applied in several places.

**Recommendation:** finish the split. Keep `timeEntries` for server data only, keep `timeEntryForm` for dashboard form state, and use `utils/*` as the single source for date, time and validation logic. Then delete the duplicates. If the A2 server changes land first, the data store shrinks to almost nothing, so do A2 first.

### A4. AnalysisView is 1,700 lines
It holds date-preset logic, aggregation, three Chart.js configs, two dropdown implementations (desktop and mobile), about 30 `console.log` calls and about 500 lines of CSS. Split it into:
- `useAnalysisData(start, end)`: fetch plus aggregation (a pure function, easy to test)
- a `<DateRangePicker>` component
- one small component per chart (or a shared `useChart(canvasRef, configFn)` that handles create, destroy and theme)

With A2's `/stats/daily`, most of the aggregation code disappears.

### A5. Backend layering is ceremonial
There are three layers (`router → service → crud`), but the services are mostly one-line pass-throughs, and they raise `HTTPException`, so the "business layer" still depends on HTTP. Meanwhile the newest router (`api_tokens.py`) skips both layers and queries the DB directly. Neither approach is wrong, but the codebase does both.

**Recommendation:** for an app this size, merge `crud.py` into the services, have the services raise domain errors (`NotFound`) mapped by one exception handler, and stick to that for new code. Also delete the duplicate `/time-summary/` endpoint in `main.py`. It is labelled "backward compatibility", but the frontend is its only caller and the same endpoint exists at `/time-entries/summary`.

### A6. Configuration
There is no config module: the secret, DB URL, CORS origins, token lifetime and static paths are all constants spread across files. One `Settings(BaseSettings)` class in `app/config.py` would fix S1, S4 and the `DATABASE_URL` issue in B7 together.

### A7. Data model
- **Nullable columns that shouldn't be:** `time_entries.date`, `time_entries.user_id` and `users.username` are all nullable ([models.py](app/models.py), initial migration). There are also no `created_at`/`updated_at` columns on entries.
- **Overnight entries are stored as `date + start_time + end_time`**, with the rule "end < start means next day, but only if end is before 06:00". That rule exists only to make the representation unambiguous, and it is re-implemented on both sides. Storing `start_at` and `end_at` as datetimes, or `start_time` plus `duration_minutes`, removes the 6 AM rule and makes every aggregate a SQL `SUM`. This is a migration, so it's worth doing only if you plan to extend the model.
- **Speaking of extending:** a time tracker without description, project or tag fields is unusual. CLAUDE.md even says entries have descriptions, which they don't. If those features are coming, plan them together with this schema change.
- **SQLite with `replicas: 1` is fine** for this scale, and `ReadWriteOnce` plus one replica is the correct setup. Just make it explicit (`strategy: Recreate`) so a rolling update never runs two pods against the same file.

### A8. Async misuse — DONE

**DONE:** `get_current_user`, `get_session_user`, and `login_for_access_token` now use plain `def`, including synchronous JWT delegation. FastAPI runs their blocking SQLAlchemy and bcrypt work in its worker thread pool. Regression tests verify execution off the event loop for login, both JWT dependency paths, and API-token authentication, with invalid-login and existing API-token coverage. Backend validation: `pytest -q` — 19 passed. The original finding below is retained for context.

`get_current_user`, `get_session_user` and `login_for_access_token` are `async def`, but they make blocking SQLAlchemy calls, and login runs bcrypt (~100–300 ms CPU) **on the event loop**. During a login, every other request stalls. Make them plain `def`; FastAPI then runs them in its threadpool automatically.

---

## 4. Code hygiene

**Dead files to delete:**
- `static/app.js` (655 lines) and `static/index.html`: the pre-Vue frontend. It still loads from CDNs and also stores passwords. The `/static` mount still serves it.
- `dev-setup.sh` and the `index.html.bak` dance in `start-dev.sh`, which exist only to work around the file above.
- `frontend/src/components/HelloWorld.vue`, `frontend/src/assets/vue.svg`, `hello.py`
- `tests/test_database.py` (empty)
- The four dead store/composable/util files from A3

**Frontend tooling:**
- **Bootstrap is loaded twice:** from npm in [main.js](frontend/src/main.js#L7-L9) and again from jsDelivr in [App.vue:20-21](frontend/src/App.vue#L20-L21), at different versions. Remove the CDN `@import`s.
- **`prettier-plugin-vue`** is an abandoned third-party plugin; Prettier handles `.vue` natively. It is the likely cause of the odd template formatting (`</button\n>` and blank lines between every tag). Remove it and run `prettier --write`.
- **Lint has 8 errors** and isn't run anywhere automated. Use the `globals` package instead of the hand-written globals list.
- **There are 60+ `console.log`/`console.error` calls** in shipped code, plus `alert()`/`confirm()` used for UX.

**Backend:**
- `pydantic.dict()` → `model_dump()`, `class Config` → `model_config`, `declarative_base` import path, and `datetime.utcnow()` are all deprecated (pytest prints 25 warnings).
- `schemas.TimeEntry` and `schemas.TimeEntryResponse` are duplicates.
- **`pyproject.toml`:** the package is named `timetrkr2` with description `"Add your description here"`. `pytest` is a runtime dependency (move it to a dev group), and `alembic` is missing. Add `ruff`.

**Infra:**
- `node:18` (EOL), `uv:latest` and `trivy-action@master` are unpinned or outdated.
- The K8s image is `:latest`.
- The probes hit `/docs` (renders Swagger). Add a cheap `/api/health` that does `SELECT 1`.

---

## 5. Testing & CI

- **Backend:** only API tokens and schema validation are tested. Nothing exercises time-entry CRUD, cross-user isolation on entries, `/time-summary` math (including overnight entries), month filtering or registration. With the existing fixture, each of these is a 5–10 line test. User isolation should come first, because it is the property that matters most.
- **Frontend:** zero tests. The pure functions in `utils/` (duration, adjustTime, week range, validation) and the Analysis aggregation are ideal for **Vitest**. Bugs B1 and B5 are exactly what such tests catch.
- **CI** builds and pushes an image but runs no tests and no lint. Add a job before the build: `uv run pytest`, `ruff check`, `npm run lint:check`, `npm run build`. Make the image push depend on it.

---

## 6. Documentation drift

CLAUDE.md, README and ARCHITECTURE describe things that aren't true:
- an `/api` prefix
- entry descriptions
- indexes on date ranges
- `pip install -e .` (the project uses `uv`)
- `TodayTimePanel.vu`
- JWT config via an env var

Docs that describe a different app are worse than no docs, especially for AI-assisted work that trusts CLAUDE.md. Trim CLAUDE.md to commands and conventions that are actually true, and update it as part of each change.

---

## Suggested order of work

| # | Change | Effort | Why now |
|---|---|---|---|
| 1 | S1 secret from env, S2 delete password storage, S3 registration flag and constraints | ~1 h | Live security issues |
| 2 | B6/B7: add alembic dep, migrate on start, fix healthcheck, honor `DATABASE_URL` (via A6 Settings) | ~1–2 h | Fresh deploys don't work |
| 3 | CI: pytest, ruff, eslint, build before push; fix the 8 lint errors | ~1 h | Keeps everything below from regressing |
| 4 | Delete dead code (legacy static app, dead stores, HelloWorld, CDN Bootstrap) | ~30 min | Halves what you have to reason about |
| 5 | A1: `/api` prefix + catch-all fix + `import.meta.env` | ~2 h | Fixes B3, the B7 `isProd` issue and the proxy sprawl together |
| 6 | Backend tests for entries, isolation and summary | ~2 h | Safety net for #7 |
| 7 | A2: date-range query, `/stats/daily`, drop `time_entries` from `/users/me`, `(user_id, date)` index, bulk import | ~1 day | Performance; fixes B2; deletes a lot of frontend code |
| 8 | Fix B1, B4, B5 and B8; add Vitest for utils | ~½ day | User-visible bugs |
| 9 | A3/A4: consolidate stores, split AnalysisView | ~1 day | Easier to keep working in |
| 10 | A7 schema rework (datetimes, NOT NULL, descriptions/projects) | larger | Only if the feature roadmap needs it |

Items 1–4 are an afternoon's work and remove most of the risk. Items 5–7 are where the architecture improves.
