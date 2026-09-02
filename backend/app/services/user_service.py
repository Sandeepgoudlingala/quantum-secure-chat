"""
User Service Module.
Handles user profile retrieval, public key updates, user searches, and user directory queries.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserProfileUpdate
from app.core.exceptions import ResourceNotFoundException


class UserService:

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        """Retrieves a user by UUID."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException(detail=f"User with ID '{user_id}' not found")
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        """Retrieves a user by username."""
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ResourceNotFoundException(detail=f"User '{username}' not found")
        return user

    @staticmethod
    def update_user_public_key(db: Session, user_id: str, public_key: str) -> User:
        """Updates user's ML-KEM public key."""
        user = UserService.get_user_by_id(db, user_id)
        user.public_key = public_key
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list_users(db: Session, current_user_id: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Lists other registered users for key exchange and chat recipient selection."""
        return db.query(User).filter(User.id != current_user_id, User.is_active == True).offset(skip).limit(limit).all()
