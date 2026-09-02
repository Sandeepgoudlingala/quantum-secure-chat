"""
Authentication DTO Request/Response Pydantic Schemas.
Enforces validation rules, password length limits, and email formats.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid user email address")
    password: str = Field(..., min_length=8, max_length=100, description="Account password (min 8 chars)")


class UserLogin(BaseModel):
    email_or_username: str = Field(..., description="Email or Username")
    password: str = Field(..., description="User password")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    email: EmailStr
    public_key: Optional[str] = None
    is_active: bool
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
