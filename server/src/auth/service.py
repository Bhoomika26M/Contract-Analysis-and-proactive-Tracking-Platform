from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from src.auth.models import User

SECRET_KEY = "your_secret_key_here"  # In production, this goes in an .env file
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_user(db: Session, first_name: str, last_name: str, email: str, password: str, role: str):
    hashed_password = get_password_hash(password)
    db_user = User(
        first_name=first_name, 
        last_name=last_name, 
        email=email, 
        hashed_password=hashed_password, 
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    # Query the database for the user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    
    # Verify the password against the stored hash
    if not verify_password(password, user.hashed_password):
        return False
        
    return user