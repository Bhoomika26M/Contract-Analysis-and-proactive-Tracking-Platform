from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.contracts.models import Obligation, Contract
from src.obligations.schemas import ObligationCreate, ObligationUpdateStatus

def create_obligation(db: Session, obligation: ObligationCreate, user_id: int):
    # Security check: Ensure the contract exists AND belongs to this user
    contract = db.query(Contract).filter(Contract.id == obligation.contract_id, Contract.owner_id == user_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found or access denied")
    
    if contract.status == "Expired":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot add new obligations to an expired contract."
        )
        
    db_obligation = Obligation(
        description=obligation.description,
        due_date=obligation.due_date,
        contract_id=obligation.contract_id
    )
    db.add(db_obligation)
    db.commit()
    db.refresh(db_obligation)
    return db_obligation

def get_obligations_by_contract(db: Session, contract_id: int, user_id: int):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.owner_id == user_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found or access denied")
        
    return db.query(Obligation).filter(Obligation.contract_id == contract_id).all()

def update_obligation_status(db: Session, obligation_id: int, status_update: ObligationUpdateStatus, user_id: int):
    # Join the tables to ensure the user owns the parent contract of this obligation
    obligation = db.query(Obligation).join(Contract).filter(
        Obligation.id == obligation_id,
        Contract.owner_id == user_id
    ).first()
    
    if not obligation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found or access denied")
        
    obligation.status = status_update.status
    db.commit()
    db.refresh(obligation)
    return obligation