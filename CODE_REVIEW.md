# TimeTrkr code and architecture review

Reviewed: 2026-10-09. Scope: backend, Vue frontend, legacy frontend, schemas, migrations, tests, build scripts, Docker, Kubernetes, CI, and project documentation.

## Overall assessment

The technology choices are sensible for a small time tracker. Vue, FastAPI, SQLAlchemy, and SQLite can support this product without a rewrite. The backend is small and readable, authorization generally scopes data to the current user, and the API token implementation has several good security properties.

However, I would not expose this version to untrusted users as shipped. The committed JWT signing secret enables impersonation, and the browser persists plaintext passwords. Deployment files also promise behavior the application does not implement. Even after those issues are fixed, there are concrete correctness problems in import, analytics, and mutation error handling.

The main architectural weakness is incomplete consolidation: two frontend store designs, two frontend applications, several implementations of date/time rules, and multiple ways to make API calls coexist. More abstraction is unlikely to help until there is one authoritative implementation of each responsibility.

## Verification and limits

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -q` | **13 passed**, 25 warnings; completed outside the sandbox after sandboxed TestClient calls hung |
| `npm run lint:check` in `frontend/` | **Failed: 8 errors, 97 warnings** |
| `npm run build` in `frontend/` | **Passed**, 167 modules transformed |
| Isolated SQLAlchemy/Pydantic checks | Confirmed acceptance of equal early-morning times, overlapping entries, empty credentials, and SQLite foreign keys disabled |
| Node checks against validation/import logic | Confirmed exported CSV headers fail import validation and impossible time/date values pass frontend validation |

Tests and database checks used isolated in-memory databases. No production data was changed. The frontend build regenerated ignored files under `static/dist/`. This review did not run a Docker image, deploy Kubernetes, perform browser accessibility testing, benchmark workloads, or audit dependencies against live vulnerability databases. Deployment findings below come from the checked-in configuration; UI findings come from source inspection and focused logic checks. Passing tests do not establish production readiness.

Priority: **P0** = fix before untrusted access; **P1** = high-impact correctness/reliability; **P2** = maintainability, usability, or scale improvement. Findings distinguish observed defects from design decisions that need an explicit policy.

## What is worth keeping

- The small monolithic deployment is appropriate. There is no demonstrated reason for microservices or a queue.
- Time-entry reads, updates, and deletes filter by `user_id`; token revocation also checks ownership. Keep these checks close to database access.
- API tokens use cryptographically random values, persist only SHA-256 hashes, expose plaintext only on creation, and require JWT authentication for management. Tests cover revocation and cross-user token deletion.
- Request validation lives on the server as well as the client. The server must remain authoritative.
- Vue routes are loaded lazily, and Chart.js instances are destroyed on unmount.
- Database migrations and dependency lockfiles exist. The problem is integrating them consistently into release and test workflows.
- The container runs as a non-root user. Preserve that while fixing volume permissions.

## Security and authentication

### 1. P0 — JWT signing key is committed to source

**Evidence:** `app/auth.py:16`, `app/auth.py:89`; JWT subjects are usernames and validation uses the constant secret.

Anyone who obtains this source can sign a token for an existing username. The API will accept that identity without a password. JWT-only token management does not protect against a forged JWT, so the attacker could also mint persistent API tokens.

**Improve:** read a required secret from deployment configuration, reject missing/default secrets at startup, and rotate the deployed key. Review and revoke suspicious API tokens if this build has been exposed: rotating the JWT key alone does not revoke API tokens already minted. Use a stable user ID as the subject. Add a test proving tokens signed with a different key are rejected. Do not copy the existing secret into deployment secrets.

### 2. P0 — Plaintext passwords are stored in localStorage

**Evidence:** `frontend/src/stores/auth.js:33–35`; the legacy `static/app.js` also contains credential restoration logic.

The active Vue frontend stores the username and password after login, although it does not need the password for subsequent requests. Any script executing on the same origin can read it; it survives browser restarts until cleared. A stolen password has consequences beyond the seven-day token lifetime.

**Improve:** remove password persistence and delete the old storage key when the updated app starts. Remove legacy automatic password-based restoration. For persistent sessions, consider a server-managed session or short-lived access tokens with a protected refresh mechanism. HttpOnly cookies reduce JavaScript access to credentials, but adopting cookies also requires deliberate CSRF protection and cookie settings.

### 3. P1 — Authentication state and session lifetime are inconsistent

**Evidence:** `frontend/src/stores/auth.js:13,37–43,80`; `frontend/src/router/index.js:34`; `frontend/src/services/api.js:55–66`; `app/auth.py:18`.

Authentication means only “a token string exists.” The frontend stores a six-day expiry value but does not enforce it, while the backend issues seven-day JWTs. The app does not validate the session globally on startup. The interceptor clears credentials based on English error text, rather than a stable error contract. Logout removes browser credentials but does not invalidate a copied JWT.

**Improve:** centralize session initialization, expiry handling, profile loading, and logout in the auth store. Give the router an explicit initializing/authenticated/anonymous state. Handle protected-request 401s consistently while leaving failed login attempts on the login form. If immediate logout invalidation matters, introduce revocable server sessions or a token/session version. Clear time-entry stores on logout/account change and ignore requests from an earlier session so cached data cannot bleed between users.

### 4. P1 — Account creation has no meaningful input or abuse controls

**Evidence:** `app/schemas.py:75–81`; `app/routers/users.py`; `app/services/user_service.py:15`; `app/routers/auth.py`.

Empty username and password values pass the schema. There are no application-level login/registration limits, username normalization rules, or bounded credential lengths. Concurrent registrations for the same username can both pass the preliminary lookup; the unique index catches the second insert, but the application does not translate that exception into a controlled response.

**Improve:** define username trimming/case policy, minimum and maximum lengths, and a password policy compatible with the chosen hashing implementation. Handle uniqueness violations with rollback and a stable conflict response. Add login throttling and registration controls appropriate to whether this is a private tracker or public service. Move blocking password hashing and synchronous ORM calls out of async route/dependency execution (see finding 15).

### 5. P2 — CORS and token permissions are broader than necessary

**Evidence:** `app/main.py:20–43`; `app/auth.py:107`; `app/routers/api_tokens.py`.

The wildcard origin defeats the apparent localhost allowlist, and credential-enabled CORS needs a coherent origin policy. This is not, by itself, an authentication bypass with bearer tokens. API tokens never expire and have all permissions supported by `get_current_user`, including profile access.

**Improve:** configure explicit origins per environment; same-origin production may need no cross-origin access. Consider read/write scopes, optional expiration, token-count limits, and rotation when integrations warrant them. Keep the current hash-only storage and JWT-only management behavior.

## Correctness and data integrity

### 6. P1 — CSV import rejects the app's own CSV export — DONE

**DONE:** Fixed in commit `68ba67f`. Shared CSV utilities normalize expected and actual headers identically, normalize `HH:MM:SS` times to `HH:MM`, and use Papa Parse for CSV parsing and export. Five regression tests pass, including export → import, quoted fields, and overnight entries; the production build passes. The original finding below is retained for context.

**Evidence:** `frontend/src/views/HistoryView.vue:308,374–384`.

Export emits `Date,Start Time,End Time,Duration`. Import lowercases those headers, then searches for `starttime` and `endtime` without removing spaces from the actual headers. A direct check reports both required columns missing.

**Improve:** normalize both expected and actual headers identically, and add an export → import round-trip test. Use a CSV parser if supporting quoted fields, embedded commas, or line breaks; splitting on commas and stripping all quotes is not a general CSV parser. Exported times include seconds from the API, while import currently requires `HH:MM`; normalize those too so fixing headers does not reveal another round-trip failure.

### 7. P1 — Mutation failures disappear in parts of the UI

**Evidence:** `frontend/src/stores/timeEntries.js:299–337`; `frontend/src/components/LastTimeEntryEdit.vue:215`; `frontend/src/components/TodayTimePanel.vue:102`; `frontend/src/views/HistoryView.vue:286`; `frontend/src/components/EditTimeEntryModal.vue:252`.

Store mutations catch errors and return `{ success: false }`, but quick edit ignores that result and reloads anyway. Delete callers likewise do not show failure. Modal update errors only reach the console. Dashboard loads turn request errors into empty arrays, making an outage look like “no time entries.”

**Improve:** choose one mutation contract and require callers to handle it. Show actionable errors in the UI; keep edits available for retry. Distinguish empty/loading/error states, and preserve existing data with a stale indicator on refresh failure. Separate “write succeeded” from “refresh failed” so retrying a refresh does not accidentally duplicate a write.

### 8. P1 — Duration and overnight semantics are ambiguous

**Evidence:** `app/schemas.py:29–49`; `app/crud.py:113–121`; `frontend/src/utils/timeUtils.js:14`; active store validation and analytics duration logic.

`02:00 → 02:00` is accepted by validation as an early-morning overnight candidate, but all duration calculations produce zero minutes. Equal times later in the day are rejected. Overnight work is allowed only when it ends before 06:00, so a legitimate `23:00 → 07:00` shift is rejected. Seconds are silently discarded rather than explicitly rejected or rounded.

**Improve:** define whether equal times mean zero, 24 hours, or invalid; preferably reject them unless a full-day entry is explicit. Represent the end date/day offset explicitly if broader overnight support is required. Decide whether totals belong entirely to the starting date or are split at midnight. For a simple manual tracker, document civil-time semantics; timezone-aware timestamps become necessary if measuring actual elapsed time across DST or supporting a running timer. Add boundary tests across midnight, month/year changes, and DST where relevant.

### 9. P1 — Overlap and duplicate entries inflate totals

**Evidence:** `app/services/time_entry_service.py:14`; `app/crud.py:25,121`.

There is no overlap check or duplicate protection. Two entries `09:00–10:00` and `09:30–10:30` produce 120 minutes, although they cover 90 distinct minutes. Re-importing a file adds the same entries again.

**Improve:** choose a product policy. If tracking elapsed work, reject or warn about overlaps, including overnight overlap with adjacent dates. If simultaneous activities are valid, label totals as summed entry time. Add import deduplication and, where retries can occur, idempotency support. Concurrency-sensitive rules belong in a transaction, not solely in frontend validation.

### 10. P1 — Analytics heat map overcounts intervals

**Evidence:** `frontend/src/views/AnalysisView.vue:1047` (`block <= endBlock`).

A `09:00–09:05` entry marks both 09:00 and 09:05 blocks. Adjacent entries double-count their shared endpoint; zero-duration early-morning entries still mark a block. The count divided by days can exceed one with overlapping entries.

**Improve:** treat intervals as half-open (`start <= block < end`). If the metric means “fraction of days worked at this time,” union occupied blocks per calendar day before counting days; if it means entry frequency, label it accordingly. Test adjacency, overlap, zero duration, and overnight wraparound.

### 11. P1 — Week definitions and date arithmetic differ between screens

**Evidence:** `frontend/src/stores/timeEntries.js:48`; `frontend/src/views/AnalysisView.vue:655,865–948`.

Dashboard uses Monday–Sunday. Analytics uses Sunday-based helpers, while its main weekly grouping starts at the selected start date because `startOnSunday` is false. A Wednesday custom range therefore becomes Wednesday–Tuesday buckets. Analytics also mixes UTC parsing of `YYYY-MM-DD`, local date arithmetic/display, and `toISOString()`, which can shift displayed dates in negative UTC offsets and create DST boundary issues.

**Improve:** define a single week-start policy and calendar-date representation. Use shared local-calendar helpers for date-only values. Align buckets to the selected week definition, clipping the first and last buckets to the requested range. Label partial weeks explicitly. Test identical datasets across dashboard and analytics in several timezones.

### 12. P2 — Frontend validation and controls diverge

**Evidence:** `frontend/src/utils/validation.js`; `frontend/src/stores/timeEntries.js:219–264`; `frontend/src/components/EditTimeEntryModal.vue:199`; `frontend/src/utils/timeUtils.js:49`.

Frontend validation accepts `99:00–99:05` and does not validate the date. Backend validation rejects impossible values, so there is a protection boundary, but import previews can call invalid entries valid. The modal clamps adjustments to `23:59`, violating the five-minute rule; other controls clamp to `23:55` or wrap across midnight. “Now” can round 23:58 to 00:00 without advancing an associated date.

**Improve:** share frontend validation and adjustment functions, validate ranges and calendar dates, and keep start/end date changes explicit. Standardize server validation-error formatting: FastAPI `detail` can be an array, while callers often treat it as a display string.

### 13. P2 — “Last entry” is limited to the current week

**Evidence:** `frontend/src/components/LastTimeEntryEdit.vue:144–160`.

The component combines today's entries and the week's entries, duplicating today's rows in its candidate set. If the most recent entry was last week, the panel has no entry; a future-dated entry in this week can be selected instead.

**Improve:** define “latest” precisely and query one record with deterministic descending date/time/ID order. Avoid fetching entire history just to select one entry.

## Architecture and performance

### 14. P1 — API location is inferred from the browser port

**Evidence:** `frontend/src/services/api.js:5–13`; `frontend/src/stores/auth.js:23`; `frontend/vite.config.js:18`; `app/main.py:82`.

Production on 8080 or Kubernetes NodePort 30080 is classified as development, so entry requests target `/api/time-entries/`, which the backend does not expose. The catch-all GET route can return HTML with status 200 for that URL. The Axios interceptor then replaces the unexpected payload with `[]`, concealing the configuration error. Login uses a separate direct Axios path, so login can work while data requests fail.

**Improve:** use a stable API prefix in all environments, with an explicit configured base URL only when needed. Put login through the same client. Make unknown API routes return JSON 404s, and throw a visible contract error for unexpected content types/shapes instead of converting them to empty data. Test production through 8080 and a reverse proxy.

### 15. P1 — Synchronous DB and password work runs inside async handlers — DONE

**DONE:** Login and both authentication dependencies now use synchronous `def` functions so FastAPI runs blocking SQLAlchemy and bcrypt work in its worker thread pool. JWT delegation is synchronous too. Regression tests check that password verification, JWT user lookup (through both dependencies), and API-token lookup/commit execute off the event loop; invalid login and existing API-token behavior are covered. Backend validation: `pytest -q` — 19 passed. The original finding below is retained for context.

**Evidence:** `app/routers/auth.py:14–18`; `app/auth.py:89–113`.

Async login calls synchronous SQLAlchemy and bcrypt directly. Async authentication dependencies also query the database and, for API tokens, commit. These operations block the event loop and can delay unrelated requests under load. The other CRUD endpoints already use normal `def` handlers.

**Improve:** keep the synchronous stack consistently in synchronous handlers/dependencies so FastAPI can run it in its worker thread pool, or deliberately adopt async DB access and offload password hashing. Do not mix async syntax with blocking operations casually. Measure before undertaking an async ORM migration.

### 16. P2 — Dashboard and analytics repeatedly retrieve complete history

**Evidence:** `frontend/src/stores/timeEntries.js:82–161`; `frontend/src/views/AnalysisView.vue:803–855`; `app/crud.py:33–45,93–100`; `app/schemas.py:87`.

Each dashboard refresh makes four sequential requests, including all historical entries to extract one week. Profile serialization includes every time entry. List endpoints have no pagination or deterministic server order. Analytics scans all entries once per selected day. The time-entry table has no `(user_id, date)` index, and month filtering uses `LIKE` on a date column rather than bounded comparisons.

**Improve:** add validated start/end-date filtering, bounded pagination with stable order, and a composite index. Return a lightweight user profile without entries. Load only the selected range; use one grouped pass for client analytics. A dashboard response containing range entries and summaries may simplify consistency, but parallel requests or deriving summaries from the bounded result is a reasonable first step. Reject malformed month filters instead of accepting arbitrary patterns.

### 17. P2 — Two store architectures exist, but the app still uses the older one

**Evidence:** imports in Dashboard, History, TodayTimePanel, WeekTimePanel, TimeEntryForm, and LastTimeEntryEdit point to `stores/timeEntries.js`. `stores/timeEntryData.js`, `stores/timeEntryForm.js`, and `composables/useTimeEntries.js` implement a parallel design.

The refactor has created duplicate rules without replacing active consumers. Date helpers and duration logic are repeated further inside the active store and analytics view. Maintaining both designs invites fixes in unused code. The unused composable also returns unwrapped store values directly; reassignment of store arrays/objects can leave those returned values stale.

**Improve:** choose one architecture and migrate it completely. A single entry-data store plus a form-local composable is sufficient; shared global form state should be justified. Use `storeToRefs` when exposing reactive store state. Remove abandoned stores and helpers after migration, and verify imports and behavior before deletion.

### 18. P2 — The service layer mostly forwards CRUD calls

**Evidence:** `app/services/time_entry_service.py`, `app/services/user_service.py`, `app/crud.py`, `app/routers/api_tokens.py`.

Most service methods forward one call; services also raise HTTP exceptions, CRUD functions own commits, and token routes bypass services entirely. Business rules and transaction ownership do not have a consistent home.

**Improve:** either simplify to routes plus focused domain/repository functions, or make services own actual policies and transactions. If retaining services, put overlap/import rules there, have repositories flush without committing, and translate domain errors into HTTP responses in routers. Avoid adding interfaces, factories, or a generic repository framework merely to make the layer diagram look more elaborate.

### 19. P2 — Analytics is too large to maintain confidently

**Evidence:** `frontend/src/views/AnalysisView.vue` is 1,704 lines; History is 548 lines.

The analytics component combines controls, calendar arithmetic, aggregation, heat-map generation, chart configuration, and lifecycle code. Debug output is extensive. History mixes table UI, API orchestration, CSV parsing, and download creation. These are the same areas where concrete bugs were found.

**Improve:** extract pure date/aggregation functions first, backed by small dataset tests. Then separate range controls and individual chart components. Extract CSV import/export logic independently of the shared entry form. Add request cancellation or generation IDs so older responses cannot overwrite a newly selected range/month. Add TypeScript incrementally around API contracts and domain utilities if the project will keep growing; it is optional, not the first fix.

### 20. P2 — Database constraints and transaction recovery are incomplete

**Evidence:** `app/models.py:11–26`; initial migration; `app/database.py`; CRUD commits throughout.

Username, password hash, time-entry date, and time-entry owner are nullable in the database. SQLite foreign-key enforcement is not enabled (isolated check returned `0`). Relationship declarations alone do not establish database integrity. Commit errors are not consistently rolled back/translated. Updates have no conflict detection, so simultaneous edits overwrite each other.

**Improve:** migrate required columns to non-null after cleaning any existing data, enable foreign keys per SQLite connection, and define deletion behavior. Add relevant constraints and transaction error handling. If concurrent editing becomes a real use case, add a version or updated-at precondition rather than silently using last-write-wins.

### 21. P2 — API token authentication turns every read into a write

**Evidence:** `app/auth.py:76–86`.

Every API-token request writes `last_used_at` and commits before executing the route, increasing SQLite write contention and coupling authentication to a successful database write. The async dependency execution was fixed in finding 15; the per-request write remains.

**Improve:** update last-used metadata at a bounded frequency, with explicit transaction ownership. Decide whether a metadata update failure should prevent otherwise valid access. Use timezone-aware UTC timestamps and keep serialization consistent if the timestamp representation changes.

## Deployment and operations

### 22. P1 — Fresh deployments do not initialize or migrate the database

**Evidence:** Dockerfile command; `run-prod.sh`; `app/main.py`; `pyproject.toml`; `migrations/env.py`; README installation instructions.

No shipped startup path runs `alembic upgrade head`, despite the README claiming automatic migrations. A new database directory will have no tables. Alembic is not declared in Python dependencies or the lockfile, although it happens to be installed locally. Tests use `Base.metadata.create_all`, bypassing the migration chain and hiding this gap.

**Improve:** declare Alembic explicitly and run migrations as a controlled release step or single migration job before serving traffic. Exercise the migration chain against an empty database in CI, then verify the running app against that schema. Do not let every replica race to migrate.

### 23. P1 — Database configuration and persistent storage assumptions disagree

**Evidence:** `app/database.py:5`; `alembic.ini`; `k8s/deployment.yml`; `k8s/persistent-volume.yml`; `DEPLOYMENT.md`.

`DATABASE_URL` is advertised and set in Kubernetes but ignored by both app and migration configuration. The manifest value `sqlite:///app/db/timetrkr.db` is also a relative SQLite path, not the intended absolute `/app/db/timetrkr.db` path. Docker creates an unspecified numeric appuser UID/GID, while Kubernetes sets `fsGroup: 1000`; a hostPath mount may not be writable. `hostPath` persistence is tied to a node, but scheduling is not pinned to that node. Raw manifests explicitly put the PVC in `default`, while Kustomize targets `timetrkr`; the two advertised apply commands do not produce equivalent deployment behavior.

**Improve:** use one validated settings source for app and migrations, with `sqlite:////app/db/timetrkr.db` for that absolute container path. Assign fixed numeric IDs and validate mounted-directory permissions. Choose one documented deployment method and consistent namespace. Use a suitable provisioner or correctly configured local volume with node affinity; validate persistence after restart and rescheduling. Keep SQLite to a deliberate single-instance deployment. PostgreSQL becomes useful when multiple replicas or sustained concurrent writes are requirements.

### 24. P1 — Health checks do not establish application readiness

**Evidence:** Dockerfile `HEALTHCHECK`; Kubernetes readiness/liveness probes.

Docker invokes `curl`, which is not installed by this Dockerfile. Kubernetes probes `/docs`, which can return successfully even when tables are absent or the database is unusable. Traffic can therefore reach an apparently healthy app that fails every meaningful operation.

**Improve:** add a cheap process liveness endpoint and a separate readiness check for database connectivity/schema readiness. Use a probe command actually present in the image, or an HTTP probe from the platform. Test an empty database, unavailable storage, and a valid migrated deployment.

### 25. P1 — Optional ingress configuration can destroy request paths

**Evidence:** `k8s/ingress.yml` sets `nginx.ingress.kubernetes.io/rewrite-target: /` on a prefix `/` route and disables SSL redirect.

When enabled with an ingress controller honoring this annotation, backend API and asset paths can be rewritten to `/`, breaking routing. TLS is only commented configuration.

**Improve:** preserve paths for this same-origin application unless an explicit subpath design requires rewriting. Configure TLS for an internet deployment. Smoke-test login, assets, entry mutations, and direct SPA navigation through the actual ingress. This finding is configuration analysis, not a live-cluster reproduction.

### 26. P2 — Build and release workflows need stronger failure and quality gates

**Evidence:** `build.sh`; `.github/workflows/build-and-push.yml`; Dockerfile; `frontend/package.json`.

`build.sh` lacks fail-fast behavior; after changing into `frontend`, it creates `frontend/static/dist`, although Vite builds into the repository's `static/dist`. A failed install/build can still end with a success message. It uses `npm install` instead of the committed lockfile's reproducible install. CI builds containers but does not run backend tests, frontend lint, migration tests, or browser tests. The Trivy action uses a moving `master` reference, and SARIF upload lacks an explicit `security-events: write` permission. The security scan happens after publication and is not configured here as a vulnerability release gate. UV is also copied from a moving `latest` image.

**Improve:** make scripts fail immediately, anchor paths to the repository, and use locked installs. Gate release on tests, lint, frontend build, and fresh-database migration smoke tests. Pin release tooling appropriately and grant the required workflow permissions. Use immutable image versions for deployments. Verify current supported base-image versions separately; this review makes no live CVE or lifecycle claims.

### 27. P2 — Operational recovery and observability are underspecified

**Evidence:** deployment guide, application startup, and database configuration.

There is no implemented backup/restore workflow, request correlation, or application metrics. SQLite persistence alone is not a recovery plan. Default rolling deployment can briefly introduce a second writer even with `replicas: 1`.

**Improve:** establish a consistent SQLite backup mechanism, retention, and a tested restore procedure. Use a single-instance update strategy appropriate to the storage. Add structured errors and request IDs without logging credentials or raw tokens. Track latency, errors, authentication failures, and database contention before investing in a large monitoring stack.

## Product experience, cleanup, and documentation

### 28. P2 — The frontend carries avoidable legacy and styling baggage

**Evidence:** `static/index.html`, `static/app.js`, `app/main.py:90–98`, `dev-setup.sh`; `frontend/src/App.vue` and `frontend/src/main.js`.

A second frontend is still served as a fallback and can be reached through `/static/`. It preserves old authentication and date behavior. Development moves its HTML file aside, creating unnecessary repository mutation. Bootstrap CSS/icons are imported from npm and again through CDN CSS, with different icon versions. Starter assets and `HelloWorld.vue` remain.

**Improve:** retire the old UI once its required features are accounted for; fail clearly when the production frontend is missing. Remove the rename workflow. Bundle one copy/version of styling dependencies, prune starter artifacts, and consolidate theme styling. Audit `.dockerignore` so development metadata directories such as `.aws`, `.codex`, and `.claude` are excluded from the build context; this is preventive hygiene, not evidence that secrets were packaged into the image.

### 29. P2 — Accessibility and user feedback deserve a focused pass

**Evidence:** icon controls in NavBar/TimeEntryForm; imperative Bootstrap modal creation in History; error handling described above; placeholder sections in Profile.

Icon controls often rely on titles or symbols rather than explicit accessible labels. Charts need equivalent readable summaries. Repeated `new Modal(...)` calls deserve lifecycle ownership and disposal. Empty results, loading, and failures should be visibly different. Profile contains “coming soon” settings rather than working account management.

**Improve:** test keyboard navigation, modal focus/escape behavior, screen-reader labels, live error announcements, mobile layouts, and dark-theme contrast. Show import progress and row-specific errors inline. Consider a reversible delete interaction or clear confirmation. Either implement account actions/settings or present the profile as the limited page it actually is. These accessibility suggestions require browser verification before claiming conformance.

### 30. P2 — Tests and documentation overstate the app's guarantees

**Evidence:** `tests/test_database.py` is empty; six schema tests and seven token tests comprise the suite. README advertises `npm run test`, but no frontend test script exists. README claims automatic migrations, profile management, and a Docker port mapping of `8000:8000`, while the container listens on 80. Architecture documentation still describes implemented screens as future work.

**Improve:** prioritize behavioral coverage over line coverage:

1. Cross-user time-entry read/update/delete isolation, invalid/expired JWTs, and credential validation.
2. CSV round trips, partial imports, repeated imports, and mutation failures.
3. Duration/overnight/overlap policies and daily/weekly/heat-map agreement.
4. Login expiry, logout/account transitions, request races, and nonstandard-port API configuration.
5. Fresh migrations plus container startup, readiness, volume persistence, and ingress routing.

Add frontend unit tests for pure logic and a small browser flow covering register/login → create → edit → history → export/import → logout. Run meaningful checks in CI. Update setup, API, deployment, and architecture documentation to match tested behavior. Clean up deprecation warnings (`model_dump`, `ConfigDict`, SQLAlchemy imports, aware UTC timestamps), and move pytest into development dependencies.

## Recommended target architecture

Keep one Vue SPA and one FastAPI service. A practical shape is:

```text
Vue views/components
  ├─ form-local state and shared date/time functions
  ├─ one entry-data store, scoped to the authenticated user
  └─ one configured API client and auth lifecycle
                 │ /api/... (consistent across environments)
FastAPI routers: request validation and HTTP translation
                 │
Domain/service functions: time policies, imports, transactions
                 │
SQLAlchemy queries: ownership filters, indexes, bounded reads
                 │
SQLite for a managed single instance; PostgreSQL when needed

Shared settings → app, migrations, deployment validation
Release checks → tests, migration smoke test, image smoke test
```

Use the server as the authority for persisted time rules and summaries. The client may calculate previews, but both should use the same documented examples and boundary cases. Avoid unnecessary extra infrastructure; reducing duplicate paths will yield more value than increasing the number of layers.

## Suggested implementation sequence

| Stage | Work | Completion evidence |
| --- | --- | --- |
| 1 — Security | Rotate/configure JWT secret; remove persisted passwords; validate credentials; define session behavior | Wrong-key JWT rejected; no password storage; empty credentials rejected; expiry/logout tests |
| 2 — Correctness | Fix CSV round trip, mutation errors, heat-map endpoints, week/date semantics, overnight/overlap policy | Small fixture datasets agree across API and UI; export imports cleanly; failure UI preserves edits |
| 3 — Deployment | Shared settings, declared/run migrations, readiness, volume/namespace/ingress fixes | Fresh image with empty volume starts correctly; DB persists; 8080/ingress flows work |
| 4 — Consolidation | One frontend/store/client path; extract analytics and CSV logic; bounded APIs and indexes | Removed duplicate code; current-week requests exclude old history; request race tests |
| 5 — Quality and UX | CI gates, recovery tests, accessibility, accurate docs, selected account/product improvements | Clean lint; gated releases; successful restore; keyboard/browser smoke tests |

My strongest recommendation is to spend the next iteration on trustworthiness: secure authentication, reliable recorded totals, visible failures, and repeatable deployments. Those improvements make the existing product substantially better without expanding its feature surface.
