"""Shared helpers: derived values and serialization.

Everything here is computed from rows that exist in the database.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Iterable

from . import models


# --- derived values --------------------------------------------------------

def days_until(target: date | None, today: date | None = None) -> int | None:
    """Days from today until `target`; negative when the date has passed."""
    if target is None:
        return None
    return (target - (today or date.today())).days


def renewal_status(expiry: date | None, today: date | None = None) -> str:
    """Maps a renewal/expiry date onto the four buckets the UI renders."""
    remaining = days_until(expiry, today)
    if remaining is None:
        return "scheduled"
    if remaining < 0:
        return "overdue"
    if remaining <= 7:
        return "urgent"
    if remaining <= 30:
        return "upcoming"
    return "scheduled"


def is_overdue(due_date: date | None, status: str, today: date | None = None) -> bool:
    if due_date is None or status == "done":
        return False
    return due_date < (today or date.today())


def decimal_to_float(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def isoformat(value: date | None) -> str | None:
    return value.isoformat() if value is not None else None


# --- serialization ---------------------------------------------------------

def obligation_to_dict(obligation: models.Obligation) -> dict[str, Any]:
    return {
        "id": obligation.id,
        "title": obligation.title,
        "description": obligation.description,
        "contract_title": obligation.contract_title,
        "department": obligation.department,
        "owner_name": obligation.owner_name,
        "due_date": obligation.due_date,
        "priority": obligation.priority,
        "status": obligation.status,
        "completion": obligation.completion,
        "created_at": obligation.created_at,
        "updated_at": obligation.updated_at,
    }


def renewal_to_dict(renewal: models.Renewal) -> dict[str, Any]:
    return {
        "id": renewal.id,
        "contract_title": renewal.contract_title,
        "counterparty": renewal.counterparty,
        "department": renewal.department,
        "owner_name": renewal.owner_name,
        "current_expiry": renewal.current_expiry,
        "renewal_date": renewal.renewal_date,
        "proposed_value": decimal_to_float(renewal.proposed_value),
        "currency": renewal.currency,
        "auto_renew": renewal.auto_renew,
        "approval_status": renewal.approval_status,
        "notes": renewal.notes,
        "created_at": renewal.created_at,
        "updated_at": renewal.updated_at,
    }


# --- analytics -------------------------------------------------------------

def obligation_summary(rows: Iterable[models.Obligation], today: date | None = None) -> dict[str, Any]:
    """Counts for the Obligation Tracker stat cards."""
    rows = list(rows)
    by_status = {s: 0 for s in models.OBLIGATION_STATUSES}
    by_priority = {p: 0 for p in models.OBLIGATION_PRIORITIES}
    overdue = 0
    for row in rows:
        by_status[row.status] = by_status.get(row.status, 0) + 1
        by_priority[row.priority] = by_priority.get(row.priority, 0) + 1
        if is_overdue(row.due_date, row.status, today):
            overdue += 1
    return {
        "total": len(rows),
        "by_status": by_status,
        "by_priority": by_priority,
        "overdue": overdue,
        "completion_average": round(sum(r.completion for r in rows) / len(rows), 1) if rows else 0,
    }


def month_sequence(months: int = 6, today: date | None = None) -> Iterable[tuple[int, int, str]]:
    """Yields (year, month_index, short_label) for the next N months."""
    now = today or date.today()
    for offset in range(months):
        year = now.year + (now.month - 1 + offset) // 12
        month = (now.month - 1 + offset) % 12
        label = date(year, month + 1, 1).strftime("%b")
        yield year, month, label


def renewal_summary(rows: Iterable[models.Renewal], today: date | None = None) -> dict[str, Any]:
    """Buckets, approval counts, 90-day pipeline and a 6-month value series."""
    rows = list(rows)
    buckets = {"overdue": 0, "urgent": 0, "upcoming": 0, "scheduled": 0}
    by_approval = {a: 0 for a in models.APPROVAL_STATUSES}
    monthly: dict[tuple[int, int], dict] = {}
    pipeline = Decimal("0")

    for renewal in rows:
        target = renewal.renewal_date or renewal.current_expiry
        bucket = renewal_status(target, today)
        buckets[bucket] = buckets.get(bucket, 0) + 1
        by_approval[renewal.approval_status] = by_approval.get(renewal.approval_status, 0) + 1

        remaining = days_until(target, today)
        if remaining is not None and 0 <= remaining <= 90:
            pipeline += renewal.proposed_value or Decimal("0")

        if target is not None:
            slot = monthly.setdefault(
                (target.year, target.month),
                {"year": target.year, "month": target.month, "value": 0.0, "count": 0},
            )
            slot["value"] += float(renewal.proposed_value or 0)
            slot["count"] += 1

    series = []
    for year, month, label in month_sequence(6, today):
        slot = monthly.get((year, month))
        series.append(
            {
                "month": label,
                "year": year,
                "value": round(slot["value"], 2) if slot else 0.0,
                "count": slot["count"] if slot else 0,
            }
        )

    return {
        "total": len(rows),
        "buckets": buckets,
        "by_approval": by_approval,
        "due_in_7_days": buckets["overdue"] + buckets["urgent"],
        "due_in_30_days": buckets["overdue"] + buckets["urgent"] + buckets["upcoming"],
        "pipeline_value_90d": float(pipeline),
        "monthly": series,
        "has_data": bool(rows),
    }
