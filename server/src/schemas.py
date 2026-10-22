from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "employee"
    organization: Optional[str] = ""
    department: Optional[str] = ""
    avatar: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    organization: str = ""
    department: str = ""
    avatar: str = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ContractBase(BaseModel):
    title: str
    reference_number: Optional[str] = ""
    contract_type: Optional[str] = ""
    department: Optional[str] = ""
    owner: Optional[str] = ""
    status: Optional[str] = "draft"
    provider_name: Optional[str] = ""
    provider_email: Optional[str] = ""
    customer_name: Optional[str] = ""
    customer_email: Optional[str] = ""
    additional_parties: Optional[str] = ""
    value: Optional[float] = 0
    currency: Optional[str] = "USD"
    payment_terms: Optional[str] = ""
    payment_frequency: Optional[str] = ""
    effective_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    auto_renewal: Optional[str] = "No"
    renewal_period: Optional[str] = ""
    renewal_notice_period: Optional[str] = ""
    termination_notice_period: Optional[str] = ""
    description: Optional[str] = ""
    summary: Optional[str] = ""
    governing_law: Optional[str] = ""
    sla_uptime: Optional[str] = ""
    key_terms: Optional[str] = ""
    compliance_requirements: Optional[str] = ""
    risk_level: Optional[str] = "low"
    compliance_score: Optional[float] = 0


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    reference_number: Optional[str] = None
    contract_type: Optional[str] = None
    department: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    provider_name: Optional[str] = None
    provider_email: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    additional_parties: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    payment_frequency: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    auto_renewal: Optional[str] = None
    renewal_period: Optional[str] = None
    renewal_notice_period: Optional[str] = None
    termination_notice_period: Optional[str] = None
    description: Optional[str] = None
    summary: Optional[str] = None
    governing_law: Optional[str] = None
    sla_uptime: Optional[str] = None
    key_terms: Optional[str] = None
    compliance_requirements: Optional[str] = None
    risk_level: Optional[str] = None
    compliance_score: Optional[float] = None


class ContractOut(ContractBase):
    id: int
    file_path: Optional[str] = ""
    extracted_text: Optional[str] = ""
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ObligationBase(BaseModel):
    title: str
    description: Optional[str] = ""
    contract_id: Optional[int] = None
    due_date: Optional[str] = ""
    status: Optional[str] = "pending"
    priority: Optional[str] = "medium"
    owner: Optional[str] = ""


class ObligationCreate(ObligationBase):
    pass


class ObligationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    contract_id: Optional[int] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    owner: Optional[str] = None


class ObligationOut(ObligationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RenewalBase(BaseModel):
    contract_id: Optional[int] = None
    renewal_date: Optional[str] = ""
    status: Optional[str] = "pending"
    value: Optional[float] = 0
    notes: Optional[str] = ""


class RenewalCreate(RenewalBase):
    pass


class RenewalUpdate(BaseModel):
    contract_id: Optional[int] = None
    renewal_date: Optional[str] = None
    status: Optional[str] = None
    value: Optional[float] = None
    notes: Optional[str] = None


class RenewalOut(RenewalBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceItemBase(BaseModel):
    contract_id: Optional[int] = None
    requirement: str
    status: Optional[str] = "pending"
    notes: Optional[str] = ""
    checked_at: Optional[str] = ""


class ComplianceItemCreate(ComplianceItemBase):
    pass


class ComplianceItemOut(ComplianceItemBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    title: str
    message: Optional[str] = ""
    notif_type: Optional[str] = "info"
    user_id: Optional[int] = None
    read: Optional[bool] = False


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = ""
    action: Optional[str] = ""
    resource: Optional[str] = ""
    details: Optional[str] = ""
    ip_address: Optional[str] = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingOut(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True
