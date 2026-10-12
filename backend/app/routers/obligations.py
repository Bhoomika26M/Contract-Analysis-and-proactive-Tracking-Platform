"""Obligation CRUD and summary."""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas, utils
from ..database import get_db

router = APIRouter(prefix="/obligations", tags=["obligations"])


def _load(db: Session, obligation_id: int) -> models.Obligation:
    obligation = db.get(models.Obligation, obligation_id)
    if obligation is None:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return obligation


@router.get("", response_model=list[schemas.ObligationOut])
def list_obligations(
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = None,
    department: str | None = None,
    owner_name: str | None = None,
    contract_title: str | None = None,
    overdue_only: bool | None = None,
    limit: int = Query(default=1000, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    stmt = select(models.Obligation).order_by(
        models.Obligation.due_date.is_(None), models.Obligation.due_date, models.Obligation.id
    )
    if search:
        needle = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(models.Obligation.title).like(needle),
                func.lower(models.Obligation.description).like(needle),
                func.lower(models.Obligation.contract_title).like(needle),
            )
        )
    if status_filter:
        stmt = stmt.where(models.Obligation.status == status_filter)
    if priority:
        stmt = stmt.where(models.Obligation.priority == priority)
    if department:
        stmt = stmt.where(models.Obligation.department == department)
    if owner_name:
        stmt = stmt.where(func.lower(models.Obligation.owner_name) == owner_name.strip().lower())
    if contract_title:
        stmt = stmt.where(
            func.lower(models.Obligation.contract_title) == contract_title.strip().lower()
        )
    if overdue_only:
        stmt = stmt.where(
            models.Obligation.due_date.isnot(None),
            models.Obligation.due_date < date.today(),
            models.Obligation.status != "done",
        )

    rows = list(db.scalars(stmt.limit(limit)).all())
    return [utils.obligation_to_dict(o) for o in rows]


@router.get("/summary", response_model=schemas.ObligationSummary)
def obligations_summary(
    department: str | None = None,
    owner_name: str | None = None,
    db: Session = Depends(get_db),
):
    """Counts used by the Obligation Tracker stat cards."""
    stmt = select(models.Obligation)
    if department:
        stmt = stmt.where(models.Obligation.department == department)
    if owner_name:
        stmt = stmt.where(func.lower(models.Obligation.owner_name) == owner_name.strip().lower())
    return utils.obligation_summary(db.scalars(stmt).all())


@router.post("", response_model=schemas.ObligationOut, status_code=status.HTTP_201_CREATED)
def create_obligation(
    payload: schemas.ObligationCreate,
    db: Session = Depends(get_db),
):
    data = payload.model_dump()

    obligation = models.Obligation(**data)
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    return utils.obligation_to_dict(obligation)


@router.get("/{obligation_id}", response_model=schemas.ObligationOut)
def get_obligation(
    obligation_id: int,
    db: Session = Depends(get_db),
):
    return utils.obligation_to_dict(_load(db, obligation_id))


@router.patch("/{obligation_id}", response_model=schemas.ObligationOut)
def update_obligation(
    obligation_id: int,
    payload: schemas.ObligationUpdate,
    db: Session = Depends(get_db),
):
    obligation = _load(db, obligation_id)
    data: dict[str, Any] = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(obligation, key, value)
    db.commit()
    db.refresh(obligation)
    return utils.obligation_to_dict(obligation)


@router.delete("/{obligation_id}", response_model=schemas.MessageResponse)
def delete_obligation(
    obligation_id: int,
    db: Session = Depends(get_db),
):
    obligation = _load(db, obligation_id)
    title = obligation.title
    db.delete(obligation)
    db.commit()
    return schemas.MessageResponse(detail=f"Deleted “{title}”")