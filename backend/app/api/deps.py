"""
API Dependencies Module.
Provides authentication context, JWT Bearer token evaluation, and database session bindings for REST routes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import CredentialsException
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    FastAPI security dependency validating JWT bearer token and returning active user model.
    """
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise CredentialsException(detail="Invalid token type for API access")

    user_id: str = payload.get("sub")
    if not user_id:
        raise CredentialsException(detail="Token payload missing subject identifier")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise CredentialsException(detail="User profile not found or deactivated")

    return user
