"""
User Directory REST API Endpoints.
Provides endpoints for retrieving user directories and querying ML-KEM public keys.
"""

from typing import List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserPublicInfo
from app.services.user_service import UserService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users Directory"])


@router.get("", response_model=List[UserPublicInfo])
@router.get("/", response_model=List[UserPublicInfo])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of all active users in the system for peer communication selection.
    """
    return UserService.list_users(db=db, current_user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserPublicInfo)
def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns public profile info for a specific user ID.
    """
    return UserService.get_user_by_id(db=db, user_id=user_id)


@router.post("/public-key", response_model=UserPublicInfo)
def upload_public_key(
    public_key: str = Body(..., embed=True, description="Base64 encoded ML-KEM Public Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Binds or updates the current user's ML-KEM public key for quantum key encapsulation.
    """
    return UserService.update_user_public_key(db=db, user_id=current_user.id, public_key=public_key)


@router.get("/{user_id}/public-key")
def get_user_public_key(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the ML-KEM public key of a recipient user to perform key encapsulation.
    """
    user = UserService.get_user_by_id(db=db, user_id=user_id)
    return {
        "user_id": user.id,
        "username": user.username,
        "public_key": user.public_key,
        "parameter_set": "ML-KEM-768"
    }
