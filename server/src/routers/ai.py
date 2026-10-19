import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/summarize/{contract_id}")
def summarize(contract_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not c:
        raise HTTPException(404, "Contract not found")
    text = c.extracted_text or ""
    if not text.strip():
        raise HTTPException(400, "No document text available")
    api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(503, "AI service not configured")
    base_url = os.getenv("NVIDIA_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    if not base_url and os.getenv("NVIDIA_API_KEY"):
        base_url = "https://integrate.api.nvidia.com/v1"
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)
        model = os.getenv("NVIDIA_MODEL") or os.getenv("OPENAI_MODEL", "meta/llama-3.1-8b-instruct")
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Summarize the contract and list key obligations."},
                {"role": "user", "content": text[:12000]},
            ],
            max_tokens=500,
        )
        return {"summary": resp.choices[0].message.content}
    except Exception as e:
        raise HTTPException(500, f"AI request failed: {e}")
