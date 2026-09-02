"""
File Upload and Encrypted Storage DTO Schemas.
Handles file metadata transfer, encryption parameters, and integrity check payloads.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FileUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    original_filename: str
    file_size: int
    mime_type: str
    file_hash: str
    uploader_id: str
    recipient_id: str
    iv: str
    auth_tag: str
    created_at: datetime


class FileMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    original_filename: str
    file_size: int
    mime_type: str
    file_hash: str
    uploader_id: str
    recipient_id: str
    created_at: datetime
