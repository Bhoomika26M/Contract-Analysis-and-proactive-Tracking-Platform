from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from src.database.core import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.obligations import service, schemas

router = APIRouter(prefix="/api/obligations", tags=["Obligations"])

@router.post("/", response_model=schemas.ObligationResponse)
def create_new_obligation(
    obligation: schemas.ObligationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return service.create_obligation(db=db, obligation=obligation, user_id=current_user.id)

@router.get("/contract/{contract_id}", response_model=List[schemas.ObligationResponse])
def read_contract_obligations(
    contract_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return service.get_obligations_by_contract(db=db, contract_id=contract_id, user_id=current_user.id)

# The PATCH endpoint for drag-and-drop updates
@router.patch("/{obligation_id}/status", response_model=schemas.ObligationResponse)
def update_status(
    obligation_id: int, 
    status_update: schemas.ObligationUpdateStatus, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return service.update_obligation_status(db=db, obligation_id=obligation_id, status_update=status_update, user_id=current_user.id)