from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.auth.models import User
from src.auth.service import get_password_hash, verify_password
from src.users import schemas


def update_user_password(
    db: Session,
    current_user: User,
    passwords: schemas.PasswordChangeRequest
):
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    current_user.hashed_password = get_password_hash(passwords.new_password)
    db.commit()
    return current_user