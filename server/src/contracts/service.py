from datetime import date
from typing import Optional, Tuple

from sqlalchemy import false, func
from sqlalchemy.orm import Session
from src.auth.models import User
from src.contracts.models import Contract, ContractApprovalLog
from src.contracts.schemas import ContractCreate, ContractUpdate

GLOBAL_VISIBILITY_ROLES = {
    "Administrator",
    "Legal Manager",
    "Compliance Officer",
    "Contract Manager",
}


def apply_contract_visibility(query, current_user: User):
    if current_user.role in GLOBAL_VISIBILITY_ROLES:
        return query
    if current_user.role in {"Department Head", "Employee"}:
        if not current_user.department:
            return query.filter(false())
        return query.filter(Contract.department.ilike(current_user.department))
    return query.filter(false())


def create_contract(
    db: Session,
    contract: ContractCreate,
    user_id: int
):
    # Create the contract and assign it to the logged-in user
    db_contract = Contract(
        title=contract.title,
        status=contract.status,
        execution_date=contract.execution_date,
        expiration_date=contract.expiration_date,
        category=contract.category,
        risk_level=contract.risk_level,
        owner_id=user_id,
        department=contract.department
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def get_all(db: Session, current_user: User):
    return apply_contract_visibility(
        db.query(Contract),
        current_user
    ).all()


def get_contract_analytics(db: Session, current_user: User):
    today = date.today()
    current_month = date(today.year, today.month, 1)
    start_ordinal = current_month.year * 12 + current_month.month - 1 - 11
    start_year, start_month_index = divmod(start_ordinal, 12)
    start_month = date(start_year, start_month_index + 1, 1)

    next_month_index = current_month.month % 12 + 1
    next_month_year = current_month.year + (1 if current_month.month == 12 else 0)
    next_month = date(next_month_year, next_month_index, 1)

    visible_contract_ids = apply_contract_visibility(
        db.query(Contract.id),
        current_user
    ).subquery()

    monthly_rows = db.query(
        func.extract("year", Contract.execution_date),
        func.extract("month", Contract.execution_date),
        func.count(Contract.id)
    ).filter(
        Contract.id.in_(visible_contract_ids),
        Contract.execution_date >= start_month,
        Contract.execution_date < next_month
    ).group_by(
        func.extract("year", Contract.execution_date),
        func.extract("month", Contract.execution_date)
    ).all()

    counts_by_month = {
        (int(year), int(month)): count
        for year, month, count in monthly_rows
    }
    monthly_activity = []
    for offset in range(12):
        month_ordinal = start_ordinal + offset
        year, month_index = divmod(month_ordinal, 12)
        month_date = date(year, month_index + 1, 1)
        monthly_activity.append({
            "month": month_date.strftime("%b %Y"),
            "contracts": counts_by_month.get((year, month_index + 1), 0)
        })

    status_rows = db.query(
        func.coalesce(Contract.status, "Unknown"),
        func.count(Contract.id)
    ).filter(
        Contract.id.in_(visible_contract_ids)
    ).group_by(
        func.coalesce(Contract.status, "Unknown")
    ).order_by(
        func.coalesce(Contract.status, "Unknown")
    ).all()

    status_distribution = [
        {"status": status, "count": count}
        for status, count in status_rows
    ]

    return {
        "total_contracts": sum(item["count"] for item in status_distribution),
        "monthly_activity": monthly_activity,
        "status_distribution": status_distribution
    }


def get_contract_by_user(db: Session, contract_id: int, user_id: int):
    return db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.owner_id == user_id
    ).first()


def get_contract_for_user(db: Session, contract_id: int, current_user: User):
    return apply_contract_visibility(
        db.query(Contract),
        current_user
    ).filter(Contract.id == contract_id).first()


def update_contract(
    db: Session,
    contract_id: int,
    contract_update: ContractUpdate,
    current_user: User
):
    db_contract = get_contract_for_user(db, contract_id, current_user)
    if db_contract is None:
        return None

    for field, value in contract_update.model_dump(exclude_unset=True).items():
        setattr(db_contract, field, value)

    db.commit()
    db.refresh(db_contract)
    return db_contract


def update_contract_status(
    db: Session,
    contract_id: int,
    new_status: str
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if contract is None:
        return None

    contract.status = new_status
    db.commit()
    db.refresh(contract)
    return contract


def renew_contract(
    db: Session,
    contract_id: int,
    expiration_date: date,
    current_user: User
):
    contract = get_contract_for_user(db, contract_id, current_user)
    if contract is None:
        return None

    contract.expiration_date = expiration_date
    contract.status = "Active"
    db.commit()
    db.refresh(contract)
    return contract


def get_pending_contracts(db: Session, current_user: User):
    return apply_contract_visibility(
        db.query(Contract),
        current_user
    ).filter(
        Contract.approval_status == "Pending"
    ).order_by(Contract.id.desc()).all()


def update_approval_status(
    db: Session,
    contract_id: int,
    user_id: int,
    approval_status: str
) -> Tuple[Optional[Contract], bool]:
    contract = db.query(Contract).filter(
        Contract.id == contract_id
    ).with_for_update().first()
    if contract is None:
        return None, False
    if contract.approval_status != "Pending":
        return contract, False

    contract.approval_status = approval_status
    db.add(ContractApprovalLog(
        contract_id=contract.id,
        user_id=user_id,
        action=approval_status
    ))
    db.commit()
    db.refresh(contract)
    return contract, True