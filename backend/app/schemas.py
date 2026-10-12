"""Pydantic request/response schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import models


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    detail: str


# --- obligations -----------------------------------------------------------

class ObligationBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    contract_title: str = ""
    department: str = ""
    owner_name: str = ""
    due_date: Optional[date] = None
    priority: str = "medium"
    status: str = "todo"
    completion: int = Field(default=0, ge=0, le=100)

    @field_validator("priority")
    @classmethod
    def _valid_priority(cls, v: str) -> str:
        if v not in models.OBLIGATION_PRIORITIES:
            raise ValueError(f"priority must be one of {models.OBLIGATION_PRIORITIES}")
        return v

    @field_validator("status")
    @classmethod
    def _valid_status(cls, v: str) -> str:
        if v not in models.OBLIGATION_STATUSES:
            raise ValueError(f"status must be one of {models.OBLIGATION_STATUSES}")
        return v


class ObligationCreate(ObligationBase):
    pass


class ObligationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    contract_title: Optional[str] = None
    department: Optional[str] = None
    owner_name: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completion: Optional[int] = Field(default=None, ge=0, le=100)


class ObligationOut(ORMModel):
    id: int
    title: str
    description: str
    contract_title: str
    department: str
    owner_name: str
    due_date: Optional[date]
    priority: str
    status: str
    completion: int
    created_at: datetime
    updated_at: datetime


class ObligationSummary(BaseModel):
    total: int
    by_status: dict
    by_priority: dict
    overdue: int
    completion_average: float


# --- renewals --------------------------------------------------------------

class RenewalBase(BaseModel):
    contract_title: str = Field(min_length=1, max_length=255)
    counterparty: str = ""
    department: str = ""
    owner_name: str = ""
    current_expiry: Optional[date] = None
    renewal_date: Optional[date] = None
    proposed_value: Optional[Decimal] = None
    currency: str = "USD"
    auto_renew: bool = False
    approval_status: str = "draft"
    notes: str = ""

    @field_validator("approval_status")
    @classmethod
    def _valid_approval(cls, v: str) -> str:
        if v not in models.APPROVAL_STATUSES:
            raise ValueError(f"approval_status must be one of {models.APPROVAL_STATUSES}")
        return v


class RenewalCreate(RenewalBase):
    pass


class RenewalUpdate(BaseModel):
    contract_title: Optional[str] = None
    counterparty: Optional[str] = None
    department: Optional[str] = None
    owner_name: Optional[str] = None
    current_expiry: Optional[date] = None
    renewal_date: Optional[date] = None
    proposed_value: Optional[Decimal] = None
    currency: Optional[str] = None
    auto_renew: Optional[bool] = None
    approval_status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("approval_status")
    @classmethod
    def _valid_approval(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in models.APPROVAL_STATUSES:
            raise ValueError(f"approval_status must be one of {models.APPROVAL_STATUSES}")
        return v


class RenewalOut(ORMModel):
    id: int
    contract_title: str
    counterparty: str
    department: str
    owner_name: str
    current_expiry: Optional[date]
    renewal_date: Optional[date]
    proposed_value: Optional[Decimal]
    currency: str
    auto_renew: bool
    approval_status: str
    notes: str
    created_at: datetime
    updated_at: datetime


class RenewalSummaryResponse(BaseModel):
    total: int
    buckets: dict
    by_approval: dict
    due_in_7_days: int
    due_in_30_days: int
    pipeline_value_90d: float
    monthly: list
    has_data: bool


# --- meta ------------------------------------------------------------------

class OptionsOut(BaseModel):
    departments: list
    obligation_priorities: list
    obligation_statuses: list
    approval_statuses: list


class HealthResponse(BaseModel):
    status: str
    database: str
    obligations: int = 0
    renewals: int = 0