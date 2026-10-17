# Contract-Analysis-and-proactive-Tracking-Platform

Enterprise Contract Management Dashboard for tracking contracts, renewals, notifications, and audit activity.

## Run the application

Install frontend dependencies:

```bash
npm install
```

Start the frontend and backend in separate terminals:

```bash
npm run dev
```

```bash
npm run backend
```

## Backend configuration

The FastAPI service uses SQLite at `backend/contractiq.sqlite3` by default, or PostgreSQL via `CONTRACTIQ_DATABASE_URL` (for example `postgresql+psycopg://user:password@localhost:5432/contractiq`). Uploaded files default to `backend/uploads/`; set `CONTRACTIQ_UPLOAD_DIR` to move them. Set `CONTRACTIQ_JWT_SECRET` to a long random value before using authentication. The first account requires `CONTRACTIQ_BOOTSTRAP_TOKEN` and a matching `bootstrap_token` in `/api/v1/auth/register`; later registrations receive the Employee role. Login returns a one-hour bearer token. Configure `SMTP_HOST`, `SMTP_FROM`, and optionally `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` to enable password-reset emails.

The API docs are available at `http://localhost:8000/docs`. Milestone 1 and 2 backend endpoints cover JWT authentication and roles, contract CRUD/search, document upload/category/archive/version management, and contract approval. Document uploads are limited to PDF, DOC, DOCX, TXT, and RTF files up to 25 MB.
