from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


def now():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="employee")
    organization = Column(String, default="")
    department = Column(String, default="")
    avatar = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    reference_number = Column(String, default="")
    contract_type = Column(String, default="")
    department = Column(String, default="")
    owner = Column(String, default="")
    status = Column(String, default="draft")
    provider_name = Column(String, default="")
    provider_email = Column(String, default="")
    customer_name = Column(String, default="")
    customer_email = Column(String, default="")
    additional_parties = Column(Text, default="")
    value = Column(Float, default=0)
    currency = Column(String, default="USD")
    payment_terms = Column(String, default="")
    payment_frequency = Column(String, default="")
    effective_date = Column(String, default="")
    expiry_date = Column(String, default="")
    auto_renewal = Column(String, default="No")
    renewal_period = Column(String, default="")
    renewal_notice_period = Column(String, default="")
    termination_notice_period = Column(String, default="")
    description = Column(Text, default="")
    summary = Column(Text, default="")
    governing_law = Column(String, default="")
    sla_uptime = Column(String, default="")
    key_terms = Column(Text, default="")
    compliance_requirements = Column(Text, default="")
    risk_level = Column(String, default="low")
    compliance_score = Column(Float, default=0)
    file_path = Column(String, default="")
    extracted_text = Column(Text, default="")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    obligations = relationship("Obligation", back_populates="contract", cascade="all, delete-orphan")
    renewals = relationship("Renewal", back_populates="contract", cascade="all, delete-orphan")


class Obligation(Base):
    __tablename__ = "obligations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    due_date = Column(String, default="")
    status = Column(String, default="pending")
    priority = Column(String, default="medium")
    owner = Column(String, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    contract = relationship("Contract", back_populates="obligations")


class Renewal(Base):
    __tablename__ = "renewals"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    renewal_date = Column(String, default="")
    status = Column(String, default="pending")
    value = Column(Float, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)

    contract = relationship("Contract", back_populates="renewals")


class ComplianceItem(Base):
    __tablename__ = "compliance_items"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    requirement = Column(String, default="")
    status = Column(String, default="pending")
    notes = Column(Text, default="")
    checked_at = Column(String, default="")
    created_at = Column(DateTime, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, default="")
    notif_type = Column(String, default="info")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String, default="")
    action = Column(String, default="")
    resource = Column(String, default="")
    details = Column(Text, default="")
    ip_address = Column(String, default="")
    created_at = Column(DateTime, default=now)


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, default="")
    updated_at = Column(DateTime, default=now, onupdate=now)
