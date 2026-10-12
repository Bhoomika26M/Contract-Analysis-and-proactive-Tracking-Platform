"""Enum choices used to populate the UI dropdowns."""

from fastapi import APIRouter

from .. import models, schemas

router = APIRouter(prefix="/options", tags=["options"])


@router.get("", response_model=schemas.OptionsOut)
def options():
    return {
        "departments": models.DEPARTMENTS,
        "obligation_priorities": models.OBLIGATION_PRIORITIES,
        "obligation_statuses": models.OBLIGATION_STATUSES,
        "approval_statuses": models.APPROVAL_STATUSES,
    }