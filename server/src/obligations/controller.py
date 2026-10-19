from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.database.core import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.obligations import service, schemas

router = APIRouter(prefix="/api/obligations", tags=["Obligations"])


def require_roles(current_user: User, allowed_roles: set[str], action: str):
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{action} is not permitted for this role"
        )


@router.post("/", response_model=schemas.ObligationResponse)
def create_new_obligation(
    obligation: schemas.ObligationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    require_roles(
        current_user,
        {"Administrator", "Contract Manager"},
        "Creating obligations"
    )
    return service.create_obligation(
        db=db,
        obligation=obligation,
        current_user=current_user
    )


@router.get("/", response_model=List[schemas.ObligationResponse])
def read_obligations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all(db=db, current_user=current_user)


@router.get("/contract/{contract_id}", response_model=List[schemas.ObligationResponse])
def read_contract_obligations(
    contract_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return service.get_obligations_for_contract(
        db=db,
        contract_id=contract_id,
        current_user=current_user
    )

# The PATCH endpoint for drag-and-drop updates
@router.patch("/{obligation_id}/status", response_model=schemas.ObligationResponse)
def update_status(
    obligation_id: int, 
    status_update: schemas.ObligationUpdateStatus, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    require_roles(
        current_user,
        {"Administrator", "Contract Manager"},
        "Editing obligations"
    )
    return service.update_obligation_status(
        db=db,
        obligation_id=obligation_id,
        status_update=status_update,
        current_user=current_user
    )