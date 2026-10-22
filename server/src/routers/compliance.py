from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


def log_audit(db, user, action, resource, details=""):
    db.add(models.AuditLog(user_id=user.id, user_name=user.name, action=action, resource=resource, details=details))
    db.commit()


@router.get("", response_model=List[schemas.ComplianceItemOut])
def list_items(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.ComplianceItem).order_by(models.ComplianceItem.id.desc()).all()


@router.post("", response_model=schemas.ComplianceItemOut)
def create_item(payload: schemas.ComplianceItemCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = models.ComplianceItem(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    log_audit(db, user, "created", "compliance", c.requirement)
    return c


@router.put("/{item_id}", response_model=schemas.ComplianceItemOut)
def update_item(item_id: int, payload: schemas.ComplianceItemCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.ComplianceItem).filter(models.ComplianceItem.id == item_id).first()
    if not c:
        raise HTTPException(404, "Compliance item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.ComplianceItem).filter(models.ComplianceItem.id == item_id).first()
    if not c:
        raise HTTPException(404, "Compliance item not found")
    db.delete(c)
    db.commit()
    return {"ok": True}
