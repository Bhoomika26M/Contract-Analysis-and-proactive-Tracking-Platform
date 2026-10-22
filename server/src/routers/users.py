from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, hash_password, require_role

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.User).order_by(models.User.id.desc()).all()


@router.post("", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db), user=Depends(require_role("administrator"))):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    u = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        organization=payload.organization or "",
        department=payload.department or "",
        avatar=payload.avatar or (payload.name[:2].upper() if payload.name else ""),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserCreate, db: Session = Depends(get_db), user=Depends(require_role("administrator"))):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.name = payload.name
    u.email = payload.email
    u.role = payload.role
    u.organization = payload.organization or u.organization
    u.department = payload.department or u.department
    u.avatar = payload.avatar or u.avatar
    if payload.password:
        u.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user=Depends(require_role("administrator"))):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == user.id:
        raise HTTPException(400, "Cannot delete yourself")
    db.delete(u)
    db.commit()
    return {"ok": True}
