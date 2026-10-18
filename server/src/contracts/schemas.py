from pydantic import BaseModel
from typing import Optional
from datetime import date

# What the React frontend sends to the backend
class ContractCreate(BaseModel):
    title: str
    status: Optional[str] = "Draft"
    execution_date: Optional[date] = None

# What the backend sends back to the React frontend
class ContractResponse(BaseModel):
    id: int
    title: str
    status: str
    execution_date: Optional[date]
    owner_id: int

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy database models

class ContractCreate(BaseModel):
    title: str
    status: Optional[str] = "Draft"
    execution_date: Optional[date] = None
    expiration_date: Optional[date] = None # Add this line

class ContractResponse(BaseModel):
    id: int
    title: str
    status: str
    execution_date: Optional[date]
    expiration_date: Optional[date] # Add this line
    owner_id: int