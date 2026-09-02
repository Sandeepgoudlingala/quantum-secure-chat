"""
Message Data Model Module.
Stores AES-256-GCM encrypted message payloads, initialization vectors (IV), and authentication tags.
Guarantees zero-plaintext storage on the server database.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Cryptographic Encrypted Payload Components
    encrypted_content = Column(Text, nullable=False)
    iv = Column(String(64), nullable=False)        # Base64 96-bit IV
    auth_tag = Column(String(64), nullable=False)  # Base64 128-bit GCM Auth Tag

    # Message Status: SENT, DELIVERED, READ
    status = Column(String(20), default="SENT", nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relational Mappings
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")

    def __repr__(self) -> str:
        return f"<Message(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, status='{self.status}')>"
