"""
Messages REST API Endpoints.
Provides endpoints for retrieving encrypted message histories and setting read status.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.message import MessageResponse, MessageStatusUpdate, MessageSendRequest
from app.services.chat_service import ChatService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/messages", tags=["Encrypted Messaging"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts an AES-256-GCM encrypted message payload and persists it.
    The plaintext never touches the server — only ciphertext, IV, and auth tag are stored.
    """
    return ChatService.save_encrypted_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        encrypted_content=payload.encrypted_content,
        iv=payload.iv,
        auth_tag=payload.auth_tag,
    )


@router.get("/conversation/{recipient_id}", response_model=List[MessageResponse])
def get_conversation(
    recipient_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves encrypted conversation message history between current user and target recipient.
    """
    return ChatService.get_conversation_history(
        db=db,
        user1_id=current_user.id,
        user2_id=recipient_id,
        skip=skip,
        limit=limit
    )


@router.put("/status", response_model=MessageResponse)
def update_status(
    status_update: MessageStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the delivery or read status of a message.
    """
    return ChatService.update_message_status(
        db=db,
        message_id=status_update.message_id,
        new_status=status_update.status
    )


@router.delete("/conversation/{recipient_id}")
def clear_conversation(
    recipient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clears encrypted conversation message history between current user and target recipient.
    """
    count = ChatService.delete_conversation_history(
        db=db,
        user1_id=current_user.id,
        user2_id=recipient_id
    )
    return {"status": "success", "deleted_count": count}


