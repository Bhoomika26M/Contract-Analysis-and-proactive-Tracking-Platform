from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from src.database.core import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    status = Column(String, default="Draft") # e.g., Draft, Active, Expired
    execution_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    
    # Links the contract to the user who created it
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Establishes the relationship to the obligations table
    obligations = relationship("Obligation", back_populates="contract")

class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String, default="Pending") # e.g., Pending, Completed
    
    # Links the obligation to its parent contract
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    
    contract = relationship("Contract", back_populates="obligations")