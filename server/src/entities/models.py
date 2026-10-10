from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
import enum
import datetime

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

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(100), nullable=True)
    status = Column(String(20), default="Active")
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    renewal_warning_days = Column(Integer, default=30)
    session_timeout = Column(Integer, default=60)
    require_2fa = Column(Boolean, default=False)