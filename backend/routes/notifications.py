from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict

from ..common import now

router = APIRouter(prefix="/api/v1", tags=["notifications"])


class NotificationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str = "system"
    title: str
    desc: str = ""
    time: str = "just now"
    read: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str | None = None
    title: str | None = None
    desc: str | None = None
    time: str | None = None
    read: bool | None = None


class AuditLogBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user: str
    action: str
    date: str
    ip: str = "127.0.0.1"
    module: str = "System"
    status: str = "Success"


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user: str | None = None
    action: str | None = None
    date: str | None = None
    ip: str | None = None
    module: str | None = None
    status: str | None = None


notifications = [
    {"id": 1, "type": "renewal", "title": "Contract Renewal Due", "desc": "Global Logistics Agreement expires in 31 days.", "time": "2 hours ago", "read": False},
    {"id": 2, "type": "compliance", "title": "Compliance Alert", "desc": "ISO 27001 obligation is overdue by 3 days.", "time": "4 hours ago", "read": False},
    {"id": 3, "type": "approval", "title": "Approval Request", "desc": "Sarah Chen requested approval for CTR-2407.", "time": "Yesterday", "read": False},
    {"id": 4, "type": "system", "title": "System Update", "desc": "ContractIQ v2.4 has been deployed successfully.", "time": "2 days ago", "read": True},
    {"id": 5, "type": "renewal", "title": "Reminder: Oracle ERP", "desc": "Oracle ERP License expires in 123 days.", "time": "3 days ago", "read": True},
    {"id": 6, "type": "compliance", "title": "GDPR Review Complete", "desc": "GDPR Data Review obligation marked completed.", "time": "4 days ago", "read": True},
]


audit_logs = [
    {"id": 1, "user": "Sarah Chen", "action": "Contract Approved", "date": "2024-07-01 09:14", "ip": "192.168.1.45", "module": "Contracts", "status": "Success"},
    {"id": 2, "user": "James Miller", "action": "Document Uploaded", "date": "2024-07-01 10:32", "ip": "10.0.0.12", "module": "Repository", "status": "Success"},
    {"id": 3, "user": "Priya Nair", "action": "Login Attempt", "date": "2024-07-01 11:00", "ip": "172.16.0.8", "module": "Auth", "status": "Failed"},
    {"id": 4, "user": "Daniel Park", "action": "Obligation Updated", "date": "2024-07-01 13:45", "ip": "192.168.1.50", "module": "Obligations", "status": "Success"},
    {"id": 5, "user": "Emma Walsh", "action": "Report Exported", "date": "2024-07-01 14:22", "ip": "10.0.0.15", "module": "Reports", "status": "Success"},
    {"id": 6, "user": "Tom Reeves", "action": "User Deactivated", "date": "2024-07-01 15:10", "ip": "192.168.1.60", "module": "Users", "status": "Success"},
]


@router.get("/notifications")
def list_notifications() -> dict[str, Any]:
    return {"data": notifications, "total": len(notifications)}


@router.get("/notifications/{notification_id}")
def get_notification(notification_id: int) -> dict[str, Any]:
    for item in notifications:
        if item["id"] == notification_id:
            return item
    raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/notifications", status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate) -> dict[str, Any]:
    item = {"id": max((n["id"] for n in notifications), default=0) + 1, **payload.model_dump()}
    notifications.insert(0, item)
    return item


@router.put("/notifications/{notification_id}")
def update_notification(notification_id: int, payload: NotificationUpdate) -> dict[str, Any]:
    for index, item in enumerate(notifications):
        if item["id"] == notification_id:
            updated = {**item, **payload.model_dump(exclude_none=True), "id": notification_id, "updatedAt": now()}
            notifications[index] = updated
            return updated
    raise HTTPException(status_code=404, detail="Notification not found")


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int) -> dict[str, Any]:
    for index, item in enumerate(notifications):
        if item["id"] == notification_id:
            notifications.pop(index)
            return {"message": f'Notification "{item["title"]}" deleted', "id": notification_id}
    raise HTTPException(status_code=404, detail="Notification not found")


@router.get("/audit-logs")
def list_audit_logs() -> dict[str, Any]:
    return {"data": audit_logs, "total": len(audit_logs)}


@router.get("/audit-logs/{audit_log_id}")
def get_audit_log(audit_log_id: int) -> dict[str, Any]:
    for item in audit_logs:
        if item["id"] == audit_log_id:
            return item
    raise HTTPException(status_code=404, detail="Audit log not found")


@router.post("/audit-logs", status_code=status.HTTP_201_CREATED)
def create_audit_log(payload: AuditLogCreate) -> dict[str, Any]:
    item = {"id": max((entry["id"] for entry in audit_logs), default=0) + 1, **payload.model_dump()}
    audit_logs.insert(0, item)
    return item


@router.put("/audit-logs/{audit_log_id}")
def update_audit_log(audit_log_id: int, payload: AuditLogUpdate) -> dict[str, Any]:
    for index, item in enumerate(audit_logs):
        if item["id"] == audit_log_id:
            updated = {**item, **payload.model_dump(exclude_none=True), "id": audit_log_id, "updatedAt": now()}
            audit_logs[index] = updated
            return updated
    raise HTTPException(status_code=404, detail="Audit log not found")


@router.delete("/audit-logs/{audit_log_id}")
def delete_audit_log(audit_log_id: int) -> dict[str, Any]:
    for index, item in enumerate(audit_logs):
        if item["id"] == audit_log_id:
            audit_logs.pop(index)
            return {"message": f'Audit log "{item["action"]}" deleted', "id": audit_log_id}
    raise HTTPException(status_code=404, detail="Audit log not found")
