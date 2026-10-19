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
    expiring_soon = db.query(models.Contract).filter(models.Contract.status.in_(["active", "draft"])).count()
    obligations_pending = db.query(models.Obligation).filter(models.Obligation.status != "completed").count()
    renewals_pending = db.query(models.Renewal).filter(models.Renewal.status == "pending").count()
    notifications_unread = db.query(models.Notification).filter(models.Notification.read == False).count()
    return {
        "total_contracts": total_contracts,
        "active_contracts": active,
        "expiring_soon": expiring_soon,
        "obligations_pending": obligations_pending,
        "renewals_pending": renewals_pending,
        "notifications_unread": notifications_unread,
    }
