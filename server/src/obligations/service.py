from fastapi import HTTPException, status
from sqlalchemy import false
from sqlalchemy.orm import Session
from src.auth.models import User
from src.contracts.models import Obligation, Contract
from src.contracts.service import apply_contract_visibility, get_contract_for_user
from src.obligations.schemas import ObligationCreate, ObligationUpdateStatus

def create_obligation(
    db: Session,
    obligation: ObligationCreate,
    current_user: User
):
    contract = get_contract_for_user(db, obligation.contract_id, current_user)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found or access denied")

    if obligation.assignee_id is not None and not db.query(User).filter(
        User.id == obligation.assignee_id
    ).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    
    if contract.status == "Expired":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot add new obligations to an expired contract."
        )
        
    db_obligation = Obligation(
        description=obligation.description,
        due_date=obligation.due_date,
        contract_id=obligation.contract_id,
        assignee_id=obligation.assignee_id
    )
    db.add(db_obligation)
    db.commit()
    db.refresh(db_obligation)
    return db_obligation

def get_all(db: Session, current_user: User):
    query = db.query(Obligation).join(Contract)
    if current_user.role in {
        "Administrator",
        "Legal Manager",
        "Compliance Officer",
        "Contract Manager",
    }:
        return query.all()
    if current_user.role == "Department Head":
        if not current_user.department:
            return query.filter(false()).all()
        return query.filter(Contract.department == current_user.department).all()
    if current_user.role == "Employee":
        return query.filter(Obligation.assignee_id == current_user.id).all()
    return query.filter(false()).all()


def get_obligations_for_contract(
    db: Session,
    contract_id: int,
    current_user: User
):
    query = db.query(Obligation).join(Contract).filter(
        Contract.id == contract_id
    )
    if current_user.role == "Employee":
        query = query.filter(Obligation.assignee_id == current_user.id)
    else:
        query = apply_contract_visibility(query, current_user)
    return query.all()

def update_obligation_status(
    db: Session,
    obligation_id: int,
    status_update: ObligationUpdateStatus,
    current_user: User
):
    obligation = db.query(Obligation).filter(
        Obligation.id == obligation_id
    ).first()
    if not obligation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obligation not found"
        )

    privileged_roles = {"Administrator", "Contract Manager", "Department Head"}
    is_assigned_employee = (
        current_user.role == "Employee"
        and obligation.assignee_id == current_user.id
    )
    if current_user.role not in privileged_roles and not is_assigned_employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )

    obligation.status = status_update.status
    db.commit()
    db.refresh(obligation)
    return obligation