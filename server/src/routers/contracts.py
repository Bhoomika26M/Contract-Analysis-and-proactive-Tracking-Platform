from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil, uuid
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..utils.extract import extract_text

router = APIRouter(prefix="/api/contracts", tags=["contracts"])
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[schemas.ContractOut])
def list_contracts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Contract).order_by(models.Contract.id.desc()).all()


@router.post("", response_model=schemas.ContractOut)
def create_contract(payload: schemas.ContractCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = models.Contract(**payload.model_dump(), created_by=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    log_audit(db, user, "created", "contract", f"Contract {c.title}")
    return c


@router.get("/{contract_id}", response_model=schemas.ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    return c


@router.put("/{contract_id}", response_model=schemas.ContractOut)
def update_contract(contract_id: int, payload: schemas.ContractUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    log_audit(db, user, "updated", "contract", f"Contract {c.title}")
    return c


@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    title = c.title
    db.delete(c)
    db.commit()
    log_audit(db, user, "deleted", "contract", f"Contract {title}")
    return {"ok": True}


@router.post("/upload", response_model=schemas.ContractOut)
async def upload_contract(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    reference_number: Optional[str] = Form(""),
    contract_type: Optional[str] = Form(""),
    department: Optional[str] = Form(""),
    owner: Optional[str] = Form(""),
    status: Optional[str] = Form("draft"),
    provider_name: Optional[str] = Form(""),
    provider_email: Optional[str] = Form(""),
    customer_name: Optional[str] = Form(""),
    customer_email: Optional[str] = Form(""),
    additional_parties: Optional[str] = Form(""),
    value: Optional[float] = Form(0),
    currency: Optional[str] = Form("USD"),
    payment_terms: Optional[str] = Form(""),
    payment_frequency: Optional[str] = Form(""),
    effective_date: Optional[str] = Form(""),
    expiry_date: Optional[str] = Form(""),
    auto_renewal: Optional[str] = Form("No"),
    renewal_period: Optional[str] = Form(""),
    renewal_notice_period: Optional[str] = Form(""),
    termination_notice_period: Optional[str] = Form(""),
    description: Optional[str] = Form(""),
    summary: Optional[str] = Form(""),
    governing_law: Optional[str] = Form(""),
    sla_uptime: Optional[str] = Form(""),
    key_terms: Optional[str] = Form(""),
    compliance_requirements: Optional[str] = Form(""),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    allowed = {".pdf", ".txt", ".docx", ".doc", ".csv", ".json"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(400, "Unsupported file type")
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as out:
        shutil.copyfileobj(file.file, out)
    text = extract_text(fpath)
    c = models.Contract(
        title=title or (file.filename or "Untitled"),
        reference_number=reference_number or "",
        contract_type=contract_type or "",
        department=department or "",
        owner=owner or "",
        status=status or "draft",
        provider_name=provider_name or "",
        provider_email=provider_email or "",
        customer_name=customer_name or "",
        customer_email=customer_email or "",
        additional_parties=additional_parties or "",
        value=value or 0,
        currency=currency or "USD",
        payment_terms=payment_terms or "",
        payment_frequency=payment_frequency or "",
        effective_date=effective_date or "",
        expiry_date=expiry_date or "",
        auto_renewal=auto_renewal or "No",
        renewal_period=renewal_period or "",
        renewal_notice_period=renewal_notice_period or "",
        termination_notice_period=termination_notice_period or "",
        description=description or "",
        summary=summary or "",
        governing_law=governing_law or "",
        sla_uptime=sla_uptime or "",
        key_terms=key_terms or "",
        compliance_requirements=compliance_requirements or "",
        file_path=fname,
        extracted_text=text,
        created_by=user.id,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    log_audit(db, user, "uploaded", "contract", f"Contract {c.title}")
    return c


def log_audit(db, user, action, resource, details=""):
    entry = models.AuditLog(user_id=user.id, user_name=user.name, action=action, resource=resource, details=details)
    db.add(entry)
    db.commit()
