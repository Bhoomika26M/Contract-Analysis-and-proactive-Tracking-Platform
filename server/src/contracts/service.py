from sqlalchemy.orm import Session
from src.contracts.models import Contract
from src.contracts.schemas import ContractCreate

def create_contract(db: Session, contract: ContractCreate, user_id: int):
    # Create the contract and assign it to the logged-in user
    db_contract = Contract(
        title=contract.title,
        status=contract.status,
        execution_date=contract.execution_date,
        expiration_date=contract.expiration_date,
        owner_id=user_id
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def get_contracts_by_user(db: Session, user_id: int):
    # Fetch only the contracts owned by the specific user
    return db.query(Contract).filter(Contract.owner_id == user_id).all()