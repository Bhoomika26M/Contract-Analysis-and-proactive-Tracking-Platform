from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ..auth import current_user
from ..common import now
from ..contracts import contracts
from .notifications import audit_logs, notifications
from ..store import PersistentList

router = APIRouter(prefix="/api/v1/contracts", tags=["approvals"])
approval_events: PersistentList = PersistentList("approval_events")


class ApprovalRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: str
    comment: str = Field(default="", max_length=2000)


@router.get("/{contract_id}/approvals")
def list_approvals(contract_id: str, _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    events = [event for event in approval_events if event["contractId"] == contract_id]
    return {"data": events, "total": len(events)}


@router.post("/{contract_id}/approval")
def process_approval(contract_id: str, payload: ApprovalRequest, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    contract_index = next((index for index, item in enumerate(contracts) if item["id"] == contract_id), None)
    if contract_index is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    decision = payload.decision.casefold()
    if decision not in {"submit", "approve", "reject"}:
        raise HTTPException(status_code=422, detail={"decision": "Use submit, approve, or reject"})
    if decision in {"approve", "reject"} and user["role"] not in {"Administrator", "Legal Manager"}:
        raise HTTPException(status_code=403, detail="Legal Manager or Administrator role required")

    contract = contracts[contract_index]
    if decision == "submit":
        if contract["status"] not in {"Draft", "Under Review"}:
            raise HTTPException(status_code=409, detail="Only draft contracts can be submitted for review")
        next_status = "Under Review"
    else:
        if contract["status"] != "Under Review":
            raise HTTPException(status_code=409, detail="Contract is not awaiting approval")
        next_status = "Approved" if decision == "approve" else "Draft"

    updated = {**contract, "status": next_status, "updatedAt": now()}
    contracts[contract_index] = updated
    event = {
        "id": f"APR-{len(approval_events) + 1:06d}",
        "contractId": contract_id,
        "decision": decision,
        "comment": payload.comment,
        "userId": user["id"],
        "user": user["name"],
        "createdAt": now(),
    }
    approval_events.insert(0, event)
    notifications.insert(0, {
        "id": max((item["id"] for item in notifications), default=0) + 1,
        "type": "approval",
        "title": f"Contract {next_status}",
        "desc": f"{contract_id} was {'approved' if decision == 'approve' else 'rejected' if decision == 'reject' else 'submitted for review'} by {user['name']}.",
        "time": "just now",
        "read": False,
    })
    audit_logs.insert(0, {
        "id": max((item["id"] for item in audit_logs), default=0) + 1,
        "user": user["name"],
        "action": f"Contract {decision}",
        "date": now(),
        "ip": "",
        "module": "Approvals",
        "status": "Success",
    })
    return {"contract": updated, "approval": event}