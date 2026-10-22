from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_items(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Notification).filter(
        (models.Notification.user_id == user.id) | (models.Notification.user_id.is_(None))
    ).order_by(models.Notification.id.desc()).all()


@router.post("", response_model=schemas.NotificationOut)
def create_item(payload: schemas.NotificationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = models.Notification(**payload.model_dump())
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.put("/{item_id}/read")
def mark_read(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(models.Notification).filter(models.Notification.id == item_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.read = True
    db.commit()
    return {"ok": True}


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(models.Notification).filter(models.Notification.id == item_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
    return {"ok": True}
