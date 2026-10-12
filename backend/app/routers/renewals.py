"""Renewal CRUD and derived renewal analytics."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas, utils
from ..database import get_db

router = APIRouter(prefix="/renewals", tags=["renewals"])


def _load(db: Session, renewal_id: int) -> models.Renewal:
    renewal = db.get(models.Renewal, renewal_id)
    if renewal is None:
        raise HTTPException(status_code=404, detail="Renewal not found")
    return renewal


@router.get("", response_model=list[schemas.RenewalOut])
def list_renewals(
    search: str | None = None,
    approval_status: str | None = None,
    department: str | None = None,
    owner_name: str | None = None,
    window_days: int | None = None,
    limit: int = Query(default=1000, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    stmt = select(models.Renewal).order_by(
        models.Renewal.renewal_date.is_(None), models.Renewal.renewal_date, models.Renewal.id
    )
    if search:
        needle = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(models.Renewal.contract_title).like(needle),
                func.lower(models.Renewal.counterparty).like(needle),
                func.lower(models.Renewal.notes).like(needle),
            )
        )
    if approval_status:
        stmt = stmt.where(models.Renewal.approval_status == approval_status)
    if department:
        stmt = stmt.where(models.Renewal.department == department)
    if owner_name:
        stmt = stmt.where(func.lower(models.Renewal.owner_name) == owner_name.strip().lower())
    if window_days is not None:
        from datetime import timedelta

        stmt = stmt.where(
            models.Renewal.renewal_date.isnot(None),
            models.Renewal.renewal_date <= date.today() + timedelta(days=window_days),
        )

    rows = list(db.scalars(stmt.limit(limit)).all())
    return [utils.renewal_to_dict(r) for r in rows]


@router.get("/summary", response_model=schemas.RenewalSummaryResponse)
def renewals_summary(
    db: Session = Depends(get_db),
):
    rows = list(db.scalars(select(models.Renewal)).all())
    return utils.renewal_summary(rows)


@router.post("", response_model=schemas.RenewalOut, status_code=status.HTTP_201_CREATED)
def create_renewal(
    payload: schemas.RenewalCreate,
    db: Session = Depends(get_db),
):
    data = payload.model_dump()

    renewal = models.Renewal(**data)
    db.add(renewal)
    db.commit()
    db.refresh(renewal)
    return utils.renewal_to_dict(renewal)


@router.get("/{renewal_id}", response_model=schemas.RenewalOut)
def get_renewal(
    renewal_id: int,
    db: Session = Depends(get_db),
):
    return utils.renewal_to_dict(_load(db, renewal_id))


@router.patch("/{renewal_id}", response_model=schemas.RenewalOut)
def update_renewal(
    renewal_id: int,
    payload: schemas.RenewalUpdate,
    db: Session = Depends(get_db),
):
    renewal = _load(db, renewal_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(renewal, key, value)
    db.commit()
    db.refresh(renewal)
    return utils.renewal_to_dict(renewal)


@router.delete("/{renewal_id}", response_model=schemas.MessageResponse)
def delete_renewal(
    renewal_id: int,
    db: Session = Depends(get_db),
):
    renewal = _load(db, renewal_id)
    title = renewal.contract_title
    db.delete(renewal)
    db.commit()
    return schemas.MessageResponse(detail=f"Deleted renewal for {title}")