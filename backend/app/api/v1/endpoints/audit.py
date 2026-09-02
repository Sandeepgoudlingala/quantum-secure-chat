"""
Audit Log REST API Endpoints.
Allows security administrators and users to query audit event records.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import AuditService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogResponse])
@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    event_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns security audit log history.
    """
    return AuditService.get_logs(
        db=db,
        skip=skip,
        limit=limit,
        user_id=None,  # Returns all logs for system oversight
        event_type=event_type
    )
