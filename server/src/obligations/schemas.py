from pydantic import BaseModel
from datetime import date

class ObligationCreate(BaseModel):
    description: str
    due_date: date
    contract_id: int

# Used for Kanban board drag-and-drop
class ObligationUpdateStatus(BaseModel):
    status: str 

class ObligationResponse(BaseModel):
    id: int
    description: str
    due_date: date
    status: str
    contract_id: int

    class Config:
        from_attributes = True