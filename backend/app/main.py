"""FastAPI application factory and global middleware.

Scope: obligations and renewals.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from . import models
from .config import settings
from .database import SessionLocal, check_database, init_db
from .routers import obligations, options, renewals

logger = logging.getLogger("contractiq")


@asynccontextmanager
async def lifespan(app: FastAPI):
    ok, detail = check_database()
    if ok:
        init_db()
        logger.info("Connected to database and ensured schema exists")
    else:
        logger.error("database is unreachable: %s", detail)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "ContractIQ — obligation tracking and renewal management. "
        "All data is persisted in SQLite."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {exc.__class__.__name__}"},
    )


for module in (options, obligations, renewals):
    app.include_router(module.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["meta"])
@app.get(f"{settings.API_PREFIX}/health", tags=["meta"])
def health():
    ok, detail = check_database()
    obligations = renewals = 0
    if ok:
        with SessionLocal() as db:
            obligations = int(
                db.scalar(select(func.count()).select_from(models.Obligation)) or 0
            )
            renewals = int(db.scalar(select(func.count()).select_from(models.Renewal)) or 0)
    return {
        "status": "ok" if ok else "degraded",
        "database": "connected" if ok else f"unavailable: {detail}",
        "obligations": obligations,
        "renewals": renewals,
    }


@app.get("/", tags=["meta"])
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health",
    }
