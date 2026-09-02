"""
Audit Log Data Model Module.
Implements immutable security event tracking for compliance, forensic analysis, and intrusion monitoring.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Event Types: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, KEY_EXCHANGE_INIT, KEY_EXCHANGE_COMPLETE, MESSAGE_SENT, FILE_UPLOADED, FILE_DOWNLOADED
    event_type = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)  # JSON-formatted string details

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relational Mapping
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, event='{self.event_type}', user_id={self.user_id}, ip='{self.ip_address}')>"
