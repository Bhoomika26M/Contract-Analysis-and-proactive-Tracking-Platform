# ContractIQ

**Obligation tracking + renewal management** — React (Vite) + FastAPI + SQLite.

Every number on screen comes from the database. There is no mock data and no fallback
sample content: when a dataset is empty the UI says *No data available*.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Database | SQLite (single file, zero setup) |

There is **no authentication** — the app opens straight on the tracker.

---

## Scope

Two modules:

| Module | Screens | API |
|---|---|---|
| **Obligations** | kanban, list and calendar views; add / edit / complete / delete | `/api/obligations` |
| **Renewals** | overview, all-renewals table, calendar and details; create / edit / approve / remind / delete | `/api/renewals` |

`/api/options` supplies the dropdown values. No dashboard, contracts, compliance,
reports, notifications, audit, users or settings module.

---

## Layout

```
backend/
  .env / .env.example     DATABASE_URL + CORS origins
  requirements.txt
  run.py                  python run.py
  app/
    main.py               FastAPI app, CORS, schema bootstrap
    config.py             settings from .env
    database.py           engine, SessionLocal, get_db, SQLite pragmas
    models.py             2 tables: obligations, renewals
    schemas.py            Pydantic request/response models
    utils.py              derived buckets, summaries, serialization
    seed.py               schema creation
    routers/
      obligations.py      CRUD + /summary
      renewals.py         CRUD + /summary
      options.py          dropdown enums

src/
  App.tsx                 page switch + layout shell
  lib/api.ts              fetch client: base URL, file downloads
  lib/types.ts            response types mirroring the backend
  lib/useResource.ts      loading / error / reload hook
  components/Layout.tsx   sidebar + header
  pages/Obligations.tsx   tracker screen
  pages/Renewals.tsx      renewals screens

scripts/
  e2e_test.py             API end-to-end test (needs the backend running)
  ui-flow.test.mjs        browser test via puppeteer-core (needs backend + dev server)
```

---

## Run it

**Backend** (creates `backend/contractiq.db` on first start):

```bash
cd backend
pip install -r requirements.txt
python run.py            # http://127.0.0.1:8000  (docs at /docs)
```

**Frontend** (already running in this workspace on port 8443; otherwise):

```bash
pnpm install
pnpm dev                 # http://localhost:8443, /api proxied to :8000
```

The database file is created automatically; no server process or credentials needed.
Point `DATABASE_URL` in `backend/.env` at any other SQLAlchemy URL to swap engines.

---

## Tests

```bash
python scripts/e2e_test.py        # backend must be running on :8000
node scripts/ui-flow.test.mjs     # also needs the dev server on :8443
```
