from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    total_contracts = db.query(models.Contract).count()
    active = db.query(models.Contract).filter(models.Contract.status == "active").count()
    pending = db.query(models.Contract).filter(models.Contract.status == "pending").count()
    now = datetime.utcnow()
    soon = now + timedelta(days=30)
    expiring_soon = db.query(models.Contract).filter(
        models.Contract.expiry_date != "",
        models.Contract.expiry_date >= now.strftime("%Y-%m-%d"),
        models.Contract.expiry_date <= soon.strftime("%Y-%m-%d"),
    ).count()
    obligations = db.query(models.Obligation).all()
    obligations_pending = len([o for o in obligations if o.status != "completed"])
    completed_obligations = len([o for o in obligations if o.status == "completed"])
    compliance_rate = round((completed_obligations / len(obligations)) * 100, 1) if obligations else 0
    renewals_pending = db.query(models.Renewal).filter(models.Renewal.status == "pending").count()
    notifications_unread = db.query(models.Notification).filter(models.Notification.read == False).count()
    total_users = db.query(models.User).count()
    return {
        "total_contracts": total_contracts,
        "active_contracts": active,
        "pending_approvals": pending,
        "expiring_soon": expiring_soon,
        "obligations_pending": obligations_pending,
        "renewals_pending": renewals_pending,
        "notifications_unread": notifications_unread,
        "total_users": total_users,
        "compliance_rate": compliance_rate,
    }
