from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# What the React frontend sends to the backend
class ContractCreate(BaseModel):
    title: str
    status: Optional[str] = "Draft"
    execution_date: Optional[date] = None
    expiration_date: Optional[date] = None
    category: Optional[str] = None
    risk_level: Optional[str] = None


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    execution_date: Optional[date] = None
    expiration_date: Optional[date] = None
    category: Optional[str] = None
    risk_level: Optional[str] = None


# What the backend sends back to the React frontend
class ContractResponse(BaseModel):
    id: int
    title: str
    status: str
    execution_date: Optional[date]
    expiration_date: Optional[date]
    category: Optional[str]
    risk_level: Optional[str]
    approval_status: str
    owner_id: int
    department: Optional[str] = None

    class Config:
        from_attributes = True


class MonthlyActivity(BaseModel):
    month: str
    contracts: int


class ContractStatusCount(BaseModel):
    status: str
    count: int


class ContractAnalyticsResponse(BaseModel):
    total_contracts: int
    monthly_activity: List[MonthlyActivity]
    status_distribution: List[ContractStatusCount]