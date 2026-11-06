from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.audit import service
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.database.core import get_db

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("")
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in {"Administrator", "Compliance Officer"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view audit logs"
        )
    return service.get_audit_logs(db)
