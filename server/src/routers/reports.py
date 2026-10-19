from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    contracts = db.query(models.Contract).all()
    by_status = Counter(c.status for c in contracts)
    by_type = Counter(c.contract_type for c in contracts if c.contract_type)
    by_dept = Counter(c.department for c in contracts if c.department)
    total_value = sum(c.value or 0 for c in contracts)
    return {
        "total_contracts": len(contracts),
        "total_value": total_value,
        "by_status": dict(by_status),
        "by_type": dict(by_type),
        "by_department": dict(by_dept),
        "obligations_total": db.query(models.Obligation).count(),
        "renewals_total": db.query(models.Renewal).count(),
    }
