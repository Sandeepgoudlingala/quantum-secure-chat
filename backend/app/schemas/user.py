"""
User Data Transfer Objects (DTO) Schema Module.
Provides public user directory representations and public key metadata schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserPublicInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    is_online: bool
    public_key: Optional[str] = None
    last_seen: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    public_key: Optional[str] = None
