from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

# UPDATED: Importing Base from your core.py file
from src.database.core import Base

class RiskLevel(enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TaskStatus(enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), unique=True, index=True)
    title = Column(String(255))
    department = Column(String(100))
    status = Column(String(50))
    value = Column(Float)
    expiration_date = Column(Date)
    
    obligations = relationship("Obligation", back_populates="contract")

class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    due_date = Column(Date)
    risk_level = Column(Enum(RiskLevel))
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    responsible_person = Column(String(100))
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    
    contract = relationship("Contract", back_populates="obligations")