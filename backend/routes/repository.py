import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from ..auth import current_user
from ..common import now
from ..contracts import contracts
from ..store import PersistentList

router = APIRouter(prefix="/api/v1/repository", tags=["repository"])
documents: PersistentList = PersistentList("documents")
storage_root = Path(os.getenv("CONTRACTIQ_UPLOAD_DIR", "backend/uploads")).resolve()
maximum_upload_size = 25 * 1024 * 1024
document_categories = {
    "Employment Contracts",
    "Vendor Contracts",
    "Service Agreements",
    "Lease Agreements",
    "Purchase Agreements",
    "Partnership Agreements",
    "Confidentiality Agreements",
}


def _document(document_id: str) -> tuple[int, dict[str, Any]]:
    for index, item in enumerate(documents):
        if item["id"] == document_id:
            return index, item
    raise HTTPException(status_code=404, detail="Document not found")


@router.get("")
def list_documents(contract_id: str | None = None, category: str | None = None, search: str | None = None, include_archived: bool = False, _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    result = [item for item in documents if (not contract_id or item["contractId"] == contract_id)]
    if category:
        result = [item for item in result if item["category"] == category]
    if search:
        query = search.casefold()
        result = [item for item in result if query in item["fileName"].casefold() or query in item["contractId"].casefold()]
    if not include_archived:
        result = [item for item in result if not item["archived"]]
    return {"data": result, "total": len(result)}


@router.post("/{contract_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(contract_id: str, file: UploadFile, category: str = Form(default="Service Agreements"), user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] not in {"Administrator", "Legal Manager", "Contract Manager"}:
        raise HTTPException(status_code=403, detail="Contract Manager or Legal Manager role required")
    if not any(item["id"] == contract_id for item in contracts):
        raise HTTPException(status_code=404, detail="Contract not found")
    if category not in document_categories:
        raise HTTPException(status_code=422, detail={"category": "Invalid document category"})
    contents = await file.read(maximum_upload_size + 1)
    if not contents:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")
    if len(contents) > maximum_upload_size:
        raise HTTPException(status_code=413, detail="Maximum document size is 25 MB")
    extension = Path(file.filename or "document").suffix.lower()
    if extension not in {".pdf", ".doc", ".docx", ".txt", ".rtf"}:
        raise HTTPException(status_code=415, detail="Unsupported document type")
    contract_docs = [item for item in documents if item["contractId"] == contract_id]
    version = max((item["version"] for item in contract_docs), default=0) + 1
    document_id = uuid4().hex
    storage_root.mkdir(parents=True, exist_ok=True)
    stored_path = storage_root / f"{document_id}{extension}"
    stored_path.write_bytes(contents)
    item = {
        "id": document_id,
        "contractId": contract_id,
        "category": category,
        "fileName": Path(file.filename or "document").name,
        "contentType": file.content_type or "application/octet-stream",
        "size": len(contents),
        "version": version,
        "archived": False,
        "uploadedBy": user["name"],
        "uploadedAt": now(),
        "storageName": stored_path.name,
    }
    documents.insert(0, item)
    return item


@router.get("/{contract_id}/versions")
def document_versions(contract_id: str, _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if not any(item["id"] == contract_id for item in contracts):
        raise HTTPException(status_code=404, detail="Contract not found")
    result = sorted((item for item in documents if item["contractId"] == contract_id), key=lambda item: item["version"], reverse=True)
    return {"data": result, "total": len(result)}


@router.get("/documents/{document_id}/download")
def download_document(document_id: str, _: dict[str, Any] = Depends(current_user)) -> FileResponse:
    _, item = _document(document_id)
    path = (storage_root / item["storageName"]).resolve()
    if storage_root not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document is unavailable")
    return FileResponse(path, media_type=item["contentType"], filename=item["fileName"])


@router.patch("/documents/{document_id}/archive")
def archive_document(document_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] not in {"Administrator", "Legal Manager", "Contract Manager"}:
        raise HTTPException(status_code=403, detail="Insufficient role")
    index, item = _document(document_id)
    updated = {**item, "archived": True, "archivedAt": now()}
    documents[index] = updated
    return updated