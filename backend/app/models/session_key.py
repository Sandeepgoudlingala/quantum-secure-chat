"""
Session Key Data Model Module.
Stores ML-KEM encapsulated ciphertext state and handshake negotiation audit metadata between peer users.
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class SessionKey(Base):
    __tablename__ = "session_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ML-KEM Encapsulated Ciphertext (Base64) transmitted during handshake
    kem_ciphertext = Column(Text, nullable=False)
    
    # Handshake status: ESTABLISHED, EXPIRED, REVOKED
    status = Column(String(20), default="ESTABLISHED", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc) + timedelta(hours=24),
        nullable=False
    )

    # Relational mappings
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def __repr__(self) -> str:
        return f"<SessionKey(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, status='{self.status}')>"
