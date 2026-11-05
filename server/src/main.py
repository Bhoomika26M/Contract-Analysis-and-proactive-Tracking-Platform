import os
try:
    from dotenv import load_dotenv
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(_BASE_DIR, ".env"), override=True)
except ImportError:
    pass
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, migrate
from . import models
from .routers import auth, users, contracts, obligations, renewals, compliance, notifications, audit, settings, dashboard, reports, ai

Base.metadata.create_all(bind=engine)
migrate()

app = FastAPI(title="ContractIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(obligations.router)
app.include_router(renewals.router)
app.include_router(compliance.router)
app.include_router(notifications.router)
app.include_router(audit.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(ai.router)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
