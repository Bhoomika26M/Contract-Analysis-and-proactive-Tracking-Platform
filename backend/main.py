from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .contracts import contracts, router as contracts_router
from .notifications import notifications, router as notifications_router
from .renewals import renewals, router as renewals_router
from .audit_logs import audit_logs
from .auth import router as auth_router
from .routes.approvals import router as approvals_router
from .routes.repository import router as repository_router

app = FastAPI(title="ContractIQ API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(contracts_router)
app.include_router(renewals_router)
app.include_router(notifications_router)
app.include_router(auth_router)
app.include_router(approvals_router)
app.include_router(repository_router)


@app.get("/")
def root() -> dict[str, Any]:
    return {"name": "ContractIQ API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/v1/stats")
def stats() -> dict[str, Any]:
    active_renewals = [item for item in renewals if item["status"] != "Terminated"]
    return {
        "contracts": {
            "total": len(contracts),
            "active": sum(item["status"] == "Active" for item in contracts),
            "expiring": sum(item["status"] == "Expiring" for item in contracts),
            "pending": sum(item["status"] == "Pending" for item in contracts),
            "archived": sum(item["status"] == "Archived" for item in contracts),
        },
        "renewals": {
            "total": len(renewals),
            "critical": sum(item["daysLeft"] < 30 for item in active_renewals),
            "upcoming": sum(30 <= item["daysLeft"] <= 90 for item in active_renewals),
            "scheduled": sum(item["daysLeft"] > 90 for item in active_renewals),
        },
        "notifications": {
            "total": len(notifications),
            "unread": sum(1 for item in notifications if not item["read"]),
        },
        "audit_logs": {
            "total": len(audit_logs),
            "failed": sum(1 for item in audit_logs if item["status"] == "Failed"),
        },
    }
