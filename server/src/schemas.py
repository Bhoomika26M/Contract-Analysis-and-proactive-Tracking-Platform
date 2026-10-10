from pydantic import BaseModel
from datetime import date
from typing import Optional
from src.entities.models import RiskLevel, TaskStatus
from datetime import datetime
from typing import Optional

# This defines what data the frontend MUST send us to create a task
class ObligationCreate(BaseModel):
    title: str
    due_date: date
    risk_level: RiskLevel
    status: Optional[TaskStatus] = TaskStatus.TODO
    responsible_person: str
    contract_id: Optional[int] = None # Optional for now, until we add contracts
class ObligationResponse(ObligationCreate):
    id: int

    class Config:
        from_attributes = True  # Tells Pydantic to read data directly from the SQLAlchemy model

class DashboardMetrics(BaseModel):
    active_contracts: int
    total_value: float
    pending_tasks: int
    completed_tasks: int

class ObligationStatusUpdate(BaseModel):
    status: TaskStatus

class UserBase(BaseModel):
    name: str
    email: str
    role: str
    department: Optional[str] = None
    status: str = "Active"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    last_active: datetime

    class Config:
        from_attributes = True

class SystemSettingsBase(BaseModel):
    renewal_warning_days: int
    session_timeout: int
    require_2fa: bool

class SystemSettingsResponse(SystemSettingsBase):
    id: int

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: str
    email: str