"""
Audit Logging Service Module.
Handles asynchronous creation and database persistence of security audit records.
"""

import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.core.app_logging import logger


class AuditService:

    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Creates and persists an audit log entry in the database.
        """
        try:
            details_str = json.dumps(details) if details else None
            log_entry = AuditLog(
                user_id=user_id,
                event_type=event_type,
                ip_address=ip_address,
                user_agent=user_agent,
                details=details_str,
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            logger.info(f"Audit Log Recorded: [{event_type}] User: {user_id} IP: {ip_address}")
            return log_entry
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record audit log: {str(e)}")
            raise

    @staticmethod
    def get_logs(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
    ):
        """Retrieves paginated audit log entries."""
        query = db.query(AuditLog)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
