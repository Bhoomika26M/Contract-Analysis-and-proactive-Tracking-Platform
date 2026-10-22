from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/renewals", tags=["renewals"])


def log_audit(db, user, action, resource, details=""):
    db.add(models.AuditLog(user_id=user.id, user_name=user.name, action=action, resource=resource, details=details))
    db.commit()


@router.get("", response_model=List[schemas.RenewalOut])
def list_items(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Renewal).order_by(models.Renewal.id.desc()).all()


@router.post("", response_model=schemas.RenewalOut)
def create_item(payload: schemas.RenewalCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = models.Renewal(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    log_audit(db, user, "created", "renewal", str(r.id))
    return r


@router.get("/{item_id}", response_model=schemas.RenewalOut)
def get_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(models.Renewal).filter(models.Renewal.id == item_id).first()
    if not r:
        raise HTTPException(404, "Renewal not found")
    return r


@router.put("/{item_id}", response_model=schemas.RenewalOut)
def update_item(item_id: int, payload: schemas.RenewalUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(models.Renewal).filter(models.Renewal.id == item_id).first()
    if not r:
        raise HTTPException(404, "Renewal not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    log_audit(db, user, "updated", "renewal", str(r.id))
    return r


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(models.Renewal).filter(models.Renewal.id == item_id).first()
    if not r:
        raise HTTPException(404, "Renewal not found")
    db.delete(r)
    db.commit()
    log_audit(db, user, "deleted", "renewal", str(item_id))
    return {"ok": True}
