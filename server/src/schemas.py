from pydantic import BaseModel
from datetime import date
from typing import Optional
from src.entities.models import RiskLevel, TaskStatus

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