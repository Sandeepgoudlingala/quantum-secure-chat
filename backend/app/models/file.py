"""
File Shared Metadata Data Model Module.
Stores metadata, storage path, SHA-256 hash digests, and AES-256-GCM encryption parameters for encrypted uploaded files.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class File(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(128), default="application/octet-stream")
    
    # SHA-256 hash digest for post-decryption data integrity verification
    file_hash = Column(String(64), nullable=False)
    
    # AES-256-GCM Parameters
    iv = Column(String(64), nullable=False)        # Base64 96-bit IV
    auth_tag = Column(String(64), nullable=False)  # Base64 128-bit Auth Tag

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relational Mappings
    uploader = relationship("User", foreign_keys=[uploader_id], back_populates="files_uploaded")
    recipient = relationship("User", foreign_keys=[recipient_id])

    def __repr__(self) -> str:
        return f"<File(id={self.id}, uploader={self.uploader_id}, name='{self.original_filename}', size={self.file_size})>"
