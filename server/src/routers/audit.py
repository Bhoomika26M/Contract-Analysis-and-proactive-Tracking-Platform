from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("", response_model=List[schemas.AuditLogOut])
def list_logs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(500).all()
