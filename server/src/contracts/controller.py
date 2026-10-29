from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.database.core import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.contracts import service, schemas
from src.audit.service import create_audit_log

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])


def require_roles(current_user: User, allowed_roles: set[str], action: str):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{action} is not permitted for this role"
        )


@router.post("/", response_model=schemas.ContractResponse)
def create_new_contract(
    contract: schemas.ContractCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # This locks the endpoint
):
    require_roles(
        current_user,
        {"Administrator", "Contract Manager", "Department Head"},
        "Creating contracts"
    )
    created_contract = service.create_contract(
        db=db,
        contract=contract,
        user_id=current_user.id
    )
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATED",
        target_resource="Contract",
        target_id=created_contract.id
    )
    return created_contract

@router.get("/", response_model=List[schemas.ContractResponse])
def read_user_contracts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # This locks the endpoint
):
    return service.get_all(db=db, current_user=current_user)


@router.get("/analytics", response_model=schemas.ContractAnalyticsResponse)
def read_contract_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_contract_analytics(db=db, current_user=current_user)


@router.get("/pending", response_model=List[schemas.ContractResponse])
def read_pending_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_pending_contracts(db=db, current_user=current_user)


def decide_contract(
    contract_id: int,
    approval_status: str,
    db: Session,
    current_user: User
):
    require_roles(
        current_user,
        {"Administrator", "Legal Manager"},
        "Approving or rejecting contracts"
    )
    contract, updated = service.update_approval_status(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
        approval_status=approval_status
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contract is no longer pending approval"
        )
    return contract


@router.post("/{contract_id}/approve", response_model=schemas.ContractResponse)
def approve_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return decide_contract(contract_id, "Approved", db, current_user)


@router.post("/{contract_id}/reject", response_model=schemas.ContractResponse)
def reject_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return decide_contract(contract_id, "Rejected", db, current_user)


@router.get("/{contract_id}", response_model=schemas.ContractResponse)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = service.get_contract_for_user(
        db=db,
        contract_id=contract_id,
        current_user=current_user
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.patch("/{contract_id}/status", response_model=schemas.ContractResponse)
def update_contract_status(
    contract_id: int,
    status_update: schemas.ContractStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in {"Administrator", "Legal Manager"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve contracts"
        )

    contract = service.update_contract_status(
        db=db,
        contract_id=contract_id,
        new_status=status_update.status
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="REJECTED" if status_update.status.casefold() == "rejected" else "APPROVED",
        target_resource="Contract",
        target_id=contract.id
    )
    return contract


@router.patch("/{contract_id}", response_model=schemas.ContractResponse)
def update_contract(
    contract_id: int,
    contract_update: schemas.ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(
        current_user,
        {"Administrator", "Contract Manager"},
        "Editing contracts"
    )
    contract = service.update_contract(
        db=db,
        contract_id=contract_id,
        contract_update=contract_update,
        current_user=current_user
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="EDITED",
        target_resource="Contract",
        target_id=contract.id
    )
    return contract


@router.patch("/{contract_id}/renew", response_model=schemas.ContractResponse)
def renew_contract(
    contract_id: int,
    renewal: schemas.ContractRenewalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(
        current_user,
        {"Administrator", "Contract Manager", "Department Head"},
        "Renewing contracts"
    )
    contract = service.renew_contract(
        db=db,
        contract_id=contract_id,
        expiration_date=renewal.expiration_date,
        current_user=current_user
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="RENEWED",
        target_resource="Contract",
        target_id=contract.id
    )
    return contract