from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from src.database.core import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.contracts import service, schemas

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])

@router.post("/", response_model=schemas.ContractResponse)
def create_new_contract(
    contract: schemas.ContractCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # This locks the endpoint
):
    return service.create_contract(db=db, contract=contract, user_id=current_user.id)

@router.get("/", response_model=List[schemas.ContractResponse])
def read_user_contracts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # This locks the endpoint
):
    return service.get_contracts_by_user(db=db, user_id=current_user.id)