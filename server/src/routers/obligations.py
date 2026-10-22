from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/obligations", tags=["obligations"])


def log_audit(db, user, action, resource, details=""):
    db.add(models.AuditLog(user_id=user.id, user_name=user.name, action=action, resource=resource, details=details))
    db.commit()


@router.get("", response_model=List[schemas.ObligationOut])
def list_items(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Obligation).order_by(models.Obligation.id.desc()).all()


@router.post("", response_model=schemas.ObligationOut)
def create_item(payload: schemas.ObligationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    o = models.Obligation(**payload.model_dump())
    db.add(o)
    db.commit()
    db.refresh(o)
    log_audit(db, user, "created", "obligation", o.title)
    return o


@router.get("/{item_id}", response_model=schemas.ObligationOut)
def get_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    o = db.query(models.Obligation).filter(models.Obligation.id == item_id).first()
    if not o:
        raise HTTPException(404, "Obligation not found")
    return o


@router.put("/{item_id}", response_model=schemas.ObligationOut)
def update_item(item_id: int, payload: schemas.ObligationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    o = db.query(models.Obligation).filter(models.Obligation.id == item_id).first()
    if not o:
        raise HTTPException(404, "Obligation not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(o, k, v)
    db.commit()
    db.refresh(o)
    log_audit(db, user, "updated", "obligation", o.title)
    return o


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    o = db.query(models.Obligation).filter(models.Obligation.id == item_id).first()
    if not o:
        raise HTTPException(404, "Obligation not found")
    title = o.title
    db.delete(o)
    db.commit()
    log_audit(db, user, "deleted", "obligation", title)
    return {"ok": True}
