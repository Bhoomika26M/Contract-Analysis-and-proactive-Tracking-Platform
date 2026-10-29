from pydantic import BaseModel
from typing import Literal, Optional


UserRole = Literal[
    "Administrator",
    "Legal Manager",
    "Compliance Officer",
    "Contract Manager",
    "Department Head",
    "Employee"
]


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: UserRole = "Employee"
    department: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    department: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
