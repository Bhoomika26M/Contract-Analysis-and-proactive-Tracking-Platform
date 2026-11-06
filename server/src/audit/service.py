from sqlalchemy.orm import Session

from src.audit.models import AuditLog
from src.auth.models import User


def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    target_resource: str,
    target_id: int
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        target_resource=target_resource,
        target_id=target_id
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(db: Session):
    rows = db.query(AuditLog, User).join(
        User,
        AuditLog.user_id == User.id
    ).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "id": audit_log.id,
            "user_id": audit_log.user_id,
            "user_name": f"{user.first_name} {user.last_name}",
            "user_email": user.email,
            "action": audit_log.action,
            "target_resource": audit_log.target_resource,
            "target_id": audit_log.target_id,
            "timestamp": audit_log.timestamp
        }
        for audit_log, user in rows
    ]
