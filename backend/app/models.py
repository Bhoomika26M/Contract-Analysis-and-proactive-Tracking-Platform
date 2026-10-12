"""SQLAlchemy ORM models. Every column here is persisted in SQLite.

Scope: obligations and renewals.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base

DEPARTMENTS = [
    "Technology",
    "Legal",
    "Finance",
    "Sales",
    "Operations",
    "Human Resources",
    "Marketing",
]

OBLIGATION_STATUSES = ["todo", "in-progress", "review", "done"]
OBLIGATION_PRIORITIES = ["critical", "high", "medium", "low"]
APPROVAL_STATUSES = ["draft", "pending", "approved", "rejected"]


class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    contract_title: Mapped[str] = mapped_column(String(255), nullable=False, default="", index=True)
    department: Mapped[str] = mapped_column(String(120), nullable=False, default="", index=True)
    owner_name: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="todo", index=True)
    completion: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Renewal(Base):
    __tablename__ = "renewals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contract_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    counterparty: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    department: Mapped[str] = mapped_column(String(120), nullable=False, default="", index=True)
    owner_name: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    current_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    renewal_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    proposed_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    approval_status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
