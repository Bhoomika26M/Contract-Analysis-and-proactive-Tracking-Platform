from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=List[schemas.SettingOut])
def list_settings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Setting).all()


@router.put("/{key}")
def set_setting(key: str, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    if not s:
        s = models.Setting(key=key, value=str(payload.get("value", "")))
        db.add(s)
    else:
        s.value = str(payload.get("value", ""))
    db.commit()
    return {"ok": True}
