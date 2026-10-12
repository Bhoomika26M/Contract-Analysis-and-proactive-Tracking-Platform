from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, field_validator

from ..common import now

router = APIRouter(prefix="/api/v1/contracts", tags=["contracts"])


class ContractBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    category: str = "Technology"
    owner: str
    start: str
    expiry: str
    value: str = "$0"
    status: str = "Draft"
    risk: str = "Low"
    notes: str = ""

    @field_validator("name", "category", "owner")
    @classmethod
    def require_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value.strip()


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    category: str | None = None
    owner: str | None = None
    start: str | None = None
    expiry: str | None = None
    value: str | None = None
    status: str | None = None
    risk: str | None = None
    notes: str | None = None
    archived: bool | None = None


def validate_contract(contract: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    for key, message in (
        ("name", "Contract name is required"),
        ("category", "Category is required"),
        ("owner", "Owner is required"),
        ("start", "Start date is required"),
        ("expiry", "Expiry date is required"),
    ):
        if not str(contract.get(key, "")).strip():
            errors[key] = message
    if contract.get("start") and contract.get("expiry") and contract["start"] >= contract["expiry"]:
        errors["expiry"] = "Expiry date must be after start date"
    if contract.get("status") and contract["status"] not in {"Active", "Expiring", "Pending", "Archived", "Draft", "Under Review"}:
        errors["status"] = "Invalid contract status"
    if contract.get("risk") and contract["risk"] not in {"Low", "Medium", "High"}:
        errors["risk"] = "Risk must be Low, Medium, or High"
    return errors


def seed_contracts() -> list[dict[str, Any]]:
    rows = [
        ("CTR-2401", "Microsoft Azure SLA", "Technology", "Sarah Chen", "2024-01-15", "2025-01-14", "$95,000", "Active", "Low"),
        ("CTR-2402", "Global Logistics Agreement", "Procurement", "James Miller", "2023-06-01", "2024-07-31", "$85,000", "Expiring", "High"),
        ("CTR-2403", "Employment Contract - Legal", "HR", "Priya Nair", "2024-03-01", "2026-02-28", "$60,000", "Active", "Low"),
        ("CTR-2404", "Oracle ERP License", "Technology", "Daniel Park", "2022-11-01", "2024-10-31", "$120,000", "Active", "Medium"),
        ("CTR-2405", "Marketing Agency Retainer", "Marketing", "Emma Walsh", "2024-02-01", "2024-12-31", "$72,000", "Active", "Low"),
        ("CTR-2406", "Office Lease - HQ", "Facilities", "Tom Reeves", "2021-01-01", "2024-12-31", "$240,000", "Expiring", "High"),
        ("CTR-2407", "Vendor NDA - FinTech Corp", "Legal", "Sarah Chen", "2024-04-01", "2027-03-31", "$10,000", "Active", "Low"),
        ("CTR-2408", "Insurance Policy - D&O", "Finance", "James Miller", "2024-01-01", "2024-12-31", "$45,000", "Pending", "Medium"),
    ]
    created_at = now()
    return [{"id": row[0], "name": row[1], "category": row[2], "owner": row[3], "start": row[4], "expiry": row[5], "value": row[6], "status": row[7], "risk": row[8], "notes": "", "createdAt": created_at} for row in rows]


contracts = seed_contracts()


def next_contract_id() -> str:
    numbers = [int(item["id"].removeprefix("CTR-")) for item in contracts if item["id"].startswith("CTR-") and item["id"][4:].isdigit()]
    return f"CTR-{max(numbers, default=2400) + 1}"


@router.get("")
def list_contracts(status_filter: str | None = Query(None, alias="status"), category: str | None = None, risk: str | None = None, search: str | None = None, date_from: str | None = None, date_to: str | None = None) -> dict[str, Any]:
    result = contracts.copy()
    if status_filter and status_filter != "All":
        result = [item for item in result if item["status"] == status_filter]
    if category and category != "All":
        result = [item for item in result if item["category"] == category]
    if risk and risk != "All":
        result = [item for item in result if item["risk"] == risk]
    if date_from:
        result = [item for item in result if item["expiry"] >= date_from]
    if date_to:
        result = [item for item in result if item["expiry"] <= date_to]
    if search:
        query = search.lower()
        result = [item for item in result if any(query in str(item[key]).lower() for key in ("name", "owner", "id"))]
    return {"data": result, "total": len(result)}


@router.get("/{contract_id}")
def get_contract(contract_id: str) -> dict[str, Any]:
    for contract in contracts:
        if contract["id"] == contract_id:
            return contract
    raise HTTPException(status_code=404, detail="Contract not found")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_contract(payload: ContractCreate) -> dict[str, Any]:
    data = payload.model_dump()
    errors = validate_contract(data)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    contract = {"id": next_contract_id(), **data, "createdAt": now()}
    contracts.insert(0, contract)
    return contract


@router.put("/{contract_id}")
def update_contract(contract_id: str, payload: ContractUpdate) -> dict[str, Any]:
    for index, contract in enumerate(contracts):
        if contract["id"] == contract_id:
            updated = {**contract, **payload.model_dump(exclude_none=True), "id": contract_id, "updatedAt": now()}
            errors = validate_contract(updated)
            if errors:
                raise HTTPException(status_code=422, detail=errors)
            contracts[index] = updated
            return updated
    raise HTTPException(status_code=404, detail="Contract not found")


@router.delete("/{contract_id}")
def delete_contract(contract_id: str) -> dict[str, str]:
    for index, contract in enumerate(contracts):
        if contract["id"] == contract_id:
            contracts.pop(index)
            return {"message": f'Contract "{contract["name"]}" deleted', "id": contract_id}
    raise HTTPException(status_code=404, detail="Contract not found")
