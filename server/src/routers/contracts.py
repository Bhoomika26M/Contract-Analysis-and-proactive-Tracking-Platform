from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
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
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
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
    uploaded = []
    if files:
        uploaded.extend(files)
    if file is not None:
        uploaded.append(file)
    if not uploaded:
        raise HTTPException(400, "No file uploaded")

    allowed = {".pdf", ".txt", ".docx", ".doc", ".csv", ".json"}
    for f in uploaded:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in allowed:
            raise HTTPException(400, "Unsupported file type")

    saved = []
    try:
        for f in uploaded:
            ext = os.path.splitext(f.filename or "")[1].lower()
            fname = f"{uuid.uuid4().hex}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as out:
                shutil.copyfileobj(f.file, out)
            text = extract_text(fpath)
            saved.append({"file": f, "fname": fname, "fpath": fpath, "text": text})

        c = models.Contract(
            title=title or (saved[0]["file"].filename or "Untitled"),
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
            file_path=saved[0]["fname"],
            extracted_text="\\n\\n".join(s["text"] for s in saved),
            created_by=user.id,
        )
        db.add(c)
        db.flush()

        for s in saved:
            doc = models.ContractDocument(
                contract_id=c.id,
                file_name=s["file"].filename or s["fname"],
                file_path=s["fname"],
                file_size=os.path.getsize(s["fpath"]) if os.path.exists(s["fpath"]) else 0,
                status="uploaded",
                extracted_text=s["text"],
            )
            db.add(doc)
        db.commit()
        db.refresh(c)
    except Exception as e:
        db.rollback()
        for s in saved:
            try:
                if os.path.exists(s["fpath"]):
                    os.remove(s["fpath"])
            except Exception:
                pass
        raise HTTPException(500, f"Upload failed: {e}")

    log_audit(db, user, "uploaded", "contract", f"Contract {c.title}")
    return c


@router.get("/{contract_id}/documents", response_model=List[schemas.ContractDocumentOut])
def list_documents(contract_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    return c.documents


@router.post("/{contract_id}/documents", response_model=List[schemas.ContractDocumentOut])
async def add_documents(
    contract_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    allowed = {".pdf", ".txt", ".docx", ".doc", ".csv", ".json"}
    for f in files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in allowed:
            raise HTTPException(400, "Unsupported file type")

    created = []
    saved_paths = []
    try:
        for f in files:
            ext = os.path.splitext(f.filename or "")[1].lower()
            fname = f"{uuid.uuid4().hex}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as out:
                shutil.copyfileobj(f.file, out)
            saved_paths.append(fpath)
            text = extract_text(fpath)
            doc = models.ContractDocument(
                contract_id=c.id,
                file_name=f.filename or fname,
                file_path=fname,
                file_size=os.path.getsize(fpath) if os.path.exists(fpath) else 0,
                status="uploaded",
                extracted_text=text,
            )
            db.add(doc)
            db.flush()
            created.append(doc)
        if not c.file_path and created:
            c.file_path = created[0].file_path
        db.commit()
        for doc in created:
            db.refresh(doc)
    except Exception as e:
        db.rollback()
        for p in saved_paths:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
        raise HTTPException(500, f"Upload failed: {e}")
    return created

@router.post("/{contract_id}/approve", response_model=schemas.ContractOut)
def approve_contract(contract_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    if c.created_by is not None and c.created_by == user.id:
        raise HTTPException(403, "You cannot approve or reject a contract that you created.")
    if user.role not in ("administrator", "legal-manager"):
        raise HTTPException(403, "Insufficient permissions")
    if c.status in ("approved", "rejected"):
        raise HTTPException(400, "Contract already processed")
    c.status = "approved"
    c.approved_by = user.id
    c.approved_by_name = user.name
    c.approved_by_role = user.role
    c.approved_at = datetime.utcnow()
    c.rejection_reason = ""
    db.commit()
    db.refresh(c)
    log_audit(db, user, "approved", "contract", f"Contract {c.title}")
    return c


@router.post("/{contract_id}/reject", response_model=schemas.ContractOut)
def reject_contract(contract_id: int, reason: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    if c.created_by is not None and c.created_by == user.id:
        raise HTTPException(403, "You cannot approve or reject a contract that you created.")
    if user.role not in ("administrator", "legal-manager"):
        raise HTTPException(403, "Insufficient permissions")
    if c.status in ("approved", "rejected"):
        raise HTTPException(400, "Contract already processed")
    c.status = "rejected"
    c.approved_by = user.id
    c.approved_by_name = user.name
    c.approved_by_role = user.role
    c.approved_at = datetime.utcnow()
    c.rejection_reason = reason or ""
    db.commit()
    db.refresh(c)
    log_audit(db, user, "rejected", "contract", f"Contract {c.title}")
    return c


def log_audit(db, user, action, resource, details=""):
    entry = models.AuditLog(user_id=user.id, user_name=user.name, action=action, resource=resource, details=details)
    db.add(entry)
    db.commit()
