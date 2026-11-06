from pydantic import BaseModel
from datetime import date
from typing import Optional

class ObligationCreate(BaseModel):
    description: str
    due_date: date
    contract_id: int
    assignee_id: Optional[int] = None
    status: str

# Used for Kanban board drag-and-drop
class ObligationUpdateStatus(BaseModel):
    status: str 

class ObligationResponse(BaseModel):
    id: int
    description: str
    due_date: date
    status: str
    contract_id: int
    assignee_id: Optional[int] = None

    class Config:
        from_attributes = True