from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.database.core import get_db
from src.users import schemas, service

router = APIRouter(prefix="/api/users", tags=["Users"])


class UserListItem(BaseModel):
    id: int
    email: str
    role: str
    department: Optional[str]


@router.get("", response_model=List[UserListItem])
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User.id, User.email, User.role, User.department).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "department": user.department
        }
        for user in users
    ]


@router.patch("/me/password")
def change_password(
    passwords: schemas.PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service.update_user_password(db, current_user, passwords)
    return {"detail": "Password updated successfully"}