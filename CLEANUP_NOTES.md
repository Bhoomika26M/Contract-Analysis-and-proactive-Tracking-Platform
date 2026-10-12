# ContractIQ — Clean Submission Notes

## What was cleaned
- Removed `node_modules/` (dependencies can be reinstalled from the package manifest and lockfile).
- Removed Python `__pycache__/` folders and `.pyc` bytecode (generated automatically by Python).
- Excluded local `.env` and `.env.local` files. Example templates are retained.
- Did not remove application source, backend routers, test scripts, Vite configuration, or `.figma/make/site.json` because these may be required by the app/tooling.

## Setup
### Frontend
From this folder:
```bash
npm install
npm run dev
```
The Vite configuration uses port `8443` by default.

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
# Optional: copy .env.example to .env if you need custom settings.
python run.py
```
The backend uses SQLite by default and creates its database when started.

## Notes
- Local environment files were intentionally excluded from the submission. The app-level `.env.example` and `backend/.env.example` are included.
- Dependencies are not bundled; install them with the commands above.
- Tests in `scripts/` require the backend to be running; the UI flow test also requires the frontend dev server.
- This cleanup removes generated/cache/local configuration files only. Please run the project once in the target environment before final acceptance.
