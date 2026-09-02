"""
Message Data Transfer Object (DTO) Pydantic Schemas.
Handles encrypted chat payload transmission, delivery status updates, and history queries.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageSendRequest(BaseModel):
    receiver_id: str = Field(..., description="Recipient user UUID")
    encrypted_content: str = Field(..., description="Base64 AES-256-GCM Ciphertext")
    iv: str = Field(..., description="Base64 96-bit IV")
    auth_tag: str = Field(..., description="Base64 128-bit Tag")


class MessageStatusUpdate(BaseModel):
    message_id: str = Field(..., description="Message UUID")
    status: str = Field(..., description="New status: DELIVERED or READ")


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sender_id: str
    receiver_id: str
    encrypted_content: str
    iv: str
    auth_tag: str
    status: str
    created_at: datetime


class WebSocketEvent(BaseModel):
    event_type: str = Field(..., description="Event action: MESSAGE, TYPING, PRESENCE, HANDSHAKE, RECEIPT")
    payload: dict
