from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, field_validator

from ..common import add_months, now, today

router = APIRouter(prefix="/api/v1/renewals", tags=["renewals"])


class RenewalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    contractId: str | None = None
    name: str
    owner: str
    expiry: str
    value: str = "$0"
    daysLeft: int = 0
    status: str = "Upcoming"
    notes: str = ""

    @field_validator("name", "owner")
    @classmethod
    def require_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value.strip()


class RenewalCreate(RenewalBase):
    pass


class RenewalUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    contractId: str | None = None
    name: str | None = None
    owner: str | None = None
    expiry: str | None = None
    value: str | None = None
    daysLeft: int | None = None
    status: str | None = None
    notes: str | None = None


class ActionRequest(BaseModel):
    term_months: int | None = None
    extend_months: int | None = None
    notes: str | None = None
    reason: str | None = None


def validate_renewal(renewal: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    if not str(renewal.get("name", "")).strip():
        errors["name"] = "Renewal name is required"
    if not str(renewal.get("owner", "")).strip():
        errors["owner"] = "Owner is required"
    if not str(renewal.get("expiry", "")).strip():
        errors["expiry"] = "Expiry date is required"
    if renewal.get("status") and renewal["status"] not in {"Critical", "Action Required", "Upcoming", "Renewed", "Extended", "Terminated"}:
        errors["status"] = "Invalid renewal status"
    return errors


def seed_renewals() -> list[dict[str, Any]]:
    rows = [
        ("RNW-001", "CTR-2406", "Office Lease - HQ", "Tom Reeves", "2024-12-31", "$240,000", 184, "Action Required"),
        ("RNW-002", "CTR-2402", "Global Logistics Agreement", "James Miller", "2024-07-31", "$85,000", 31, "Critical"),
        ("RNW-003", "CTR-2404", "Oracle ERP License", "Daniel Park", "2024-10-31", "$120,000", 123, "Upcoming"),
        ("RNW-004", "CTR-2408", "Insurance Policy - D&O", "James Miller", "2024-12-31", "$45,000", 184, "Upcoming"),
        ("RNW-005", "CTR-2405", "Marketing Agency Retainer", "Emma Walsh", "2024-12-31", "$72,000", 184, "Upcoming"),
    ]
    created_at = now()
    return [{"id": row[0], "contractId": row[1], "name": row[2], "owner": row[3], "expiry": row[4], "value": row[5], "daysLeft": row[6], "status": row[7], "notes": "", "renewedOn": None, "extendedTo": None, "terminatedOn": None, "createdAt": created_at} for row in rows]


renewals = seed_renewals()


def next_renewal_id() -> str:
    numbers = [int(item["id"].removeprefix("RNW-")) for item in renewals if item["id"].startswith("RNW-") and item["id"][4:].isdigit()]
    return f"RNW-{max(numbers, default=0) + 1:03d}"


@router.get("")
def list_renewals(status_filter: str | None = Query(None, alias="status"), search: str | None = None) -> dict[str, Any]:
    result = renewals.copy()
    if status_filter and status_filter != "All":
        result = [item for item in result if item["status"] == status_filter]
    if search:
        query = search.lower()
        result = [item for item in result if query in item["name"].lower() or query in item["owner"].lower()]
    active = [item for item in result if item["status"] != "Terminated"]
    stats = {"critical": sum(item["daysLeft"] < 30 for item in active), "upcoming": sum(30 <= item["daysLeft"] <= 90 for item in active), "scheduled": sum(item["daysLeft"] > 90 for item in active), "total": len(result)}
    return {"data": result, "stats": stats, "total": len(result)}


@router.get("/{renewal_id}")
def get_renewal(renewal_id: str) -> dict[str, Any]:
    for renewal in renewals:
        if renewal["id"] == renewal_id:
            return renewal
    raise HTTPException(status_code=404, detail="Renewal not found")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_renewal(payload: RenewalCreate) -> dict[str, Any]:
    data = payload.model_dump()
    errors = validate_renewal(data)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    renewal = {"id": next_renewal_id(), **data, "renewedOn": None, "extendedTo": None, "terminatedOn": None, "createdAt": now()}
    renewals.insert(0, renewal)
    return renewal


@router.put("/{renewal_id}")
def update_renewal(renewal_id: str, payload: RenewalUpdate) -> dict[str, Any]:
    index, renewal = find_renewal(renewal_id)
    updated = {**renewal, **payload.model_dump(exclude_none=True), "id": renewal_id, "updatedAt": now()}
    errors = validate_renewal(updated)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    renewals[index] = updated
    return updated


def find_renewal(renewal_id: str) -> tuple[int, dict[str, Any]]:
    for index, renewal in enumerate(renewals):
        if renewal["id"] == renewal_id:
            return index, renewal
    raise HTTPException(status_code=404, detail="Renewal not found")


@router.post("/{renewal_id}/renew")
def renew_contract(renewal_id: str, payload: ActionRequest) -> dict[str, Any]:
    index, renewal = find_renewal(renewal_id)
    months = payload.term_months or 12
    if months <= 0:
        raise HTTPException(status_code=422, detail={"term_months": "Must be a positive number"})
    updated = {**renewal, "expiry": add_months(renewal["expiry"], months), "daysLeft": renewal["daysLeft"] + months * 30, "status": "Renewed", "renewedOn": today(), "notes": payload.notes or renewal["notes"], "updatedAt": now()}
    renewals[index] = updated
    return {"message": f"Renewed for {months} months", "renewal": updated}


@router.post("/{renewal_id}/extend")
def extend_contract(renewal_id: str, payload: ActionRequest) -> dict[str, Any]:
    index, renewal = find_renewal(renewal_id)
    months = payload.extend_months or 3
    if months <= 0:
        raise HTTPException(status_code=422, detail={"extend_months": "Must be a positive number"})
    expiry = add_months(renewal["expiry"], months)
    updated = {**renewal, "expiry": expiry, "daysLeft": renewal["daysLeft"] + months * 30, "status": "Extended", "extendedTo": expiry, "notes": payload.notes or renewal["notes"], "updatedAt": now()}
    renewals[index] = updated
    return {"message": f"Extended by {months} months", "renewal": updated}


@router.post("/{renewal_id}/terminate")
def terminate_contract(renewal_id: str, payload: ActionRequest) -> dict[str, Any]:
    index, renewal = find_renewal(renewal_id)
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(status_code=422, detail={"reason": "Termination reason is required"})
    updated = {**renewal, "status": "Terminated", "terminatedOn": today(), "notes": payload.reason.strip(), "updatedAt": now()}
    renewals[index] = updated
    return {"message": "Contract terminated", "renewal": updated}


@router.delete("/{renewal_id}")
def delete_renewal(renewal_id: str) -> dict[str, str]:
    index, renewal = find_renewal(renewal_id)
    renewals.pop(index)
    return {"message": f'Renewal "{renewal["name"]}" deleted', "id": renewal_id}
