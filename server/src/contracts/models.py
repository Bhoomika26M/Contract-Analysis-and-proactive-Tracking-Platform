from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from src.database.core import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    status = Column(String, default="Draft") # e.g., Draft, Active, Expired
    execution_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    approval_status = Column(String, nullable=False, default="Pending")
    
    # Links the contract to the user who created it
    owner_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String, nullable=True)
    
    # Establishes the relationship to the obligations table
    obligations = relationship("Obligation", back_populates="contract")


class ContractApprovalLog(Base):
    __tablename__ = "contract_approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String, default="Pending") # e.g., Pending, Completed
    
    # Links the obligation to its parent contract
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    assignee_id = Column(
        Integer,
        ForeignKey("users.id", name="fk_obligations_assignee_id_users"),
        nullable=True
    )
    
    contract = relationship("Contract", back_populates="obligations")