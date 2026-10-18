from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.database.core import get_db
from src.auth.service import create_user, authenticate_user, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = create_user(
        db=db,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=user.password,
        role=user.role
    )
    return {"message": "User registered successfully", "email": new_user.email}


class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Generate the JWT token containing the user's email and role
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_email": user.email,
        "role": user.role
    }