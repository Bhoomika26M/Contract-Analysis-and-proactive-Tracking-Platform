from sqlalchemy import Column, Integer, String, Boolean
from src.database.core import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Stores roles like: Administrator, Legal Manager, Compliance Officer, etc.
    role = Column(String, nullable=False) 

    department = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)