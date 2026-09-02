"""
Chat Business Logic Service.
Manages encrypted message persistence, status transitions (SENT, DELIVERED, READ),
and message history queries between peer users.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.message import Message
from app.schemas.message import MessageSendRequest
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException
from app.core.app_logging import logger


class ChatService:

    @staticmethod
    def save_encrypted_message(
        db: Session,
        sender_id: str,
        receiver_id: str,
        encrypted_content: str,
        iv: str,
        auth_tag: str
    ) -> Message:
        """
        Stores an AES-256-GCM encrypted chat payload in the database.
        Zero plaintext is handled or logged.
        """
        msg = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            encrypted_content=encrypted_content,
            iv=iv,
            auth_tag=auth_tag,
            status="SENT"
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        # Audit log message sending event
        AuditService.log_event(
            db=db,
            event_type="MESSAGE_SENT",
            user_id=sender_id,
            details={"recipient_id": receiver_id, "message_id": msg.id}
        )

        logger.info(f"Encrypted message saved: ID {msg.id} from {sender_id} to {receiver_id}")
        return msg

    @staticmethod
    def update_message_status(db: Session, message_id: str, new_status: str) -> Message:
        """Updates message delivery or read status."""
        msg = db.query(Message).filter(Message.id == message_id).first()
        if not msg:
            raise ResourceNotFoundException(detail=f"Message ID {message_id} not found")

        msg.status = new_status
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def get_conversation_history(
        db: Session,
        user1_id: str,
        user2_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Message]:
        """Retrieves encrypted message history between two users ordered chronologically."""
        return db.query(Message).filter(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def delete_conversation_history(db: Session, user1_id: str, user2_id: str) -> int:
        """Deletes all message history between two users for session clearing/forward secrecy."""
        deleted_count = db.query(Message).filter(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        ).delete(synchronize_session=False)
        db.commit()
        logger.info(f"Deleted {deleted_count} messages between {user1_id} and {user2_id}")
        return deleted_count

