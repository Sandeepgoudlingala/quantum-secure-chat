"""
Authentication REST API Endpoints.
Exposes endpoints for user registration, authentication, token refresh, and profile inspection.
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, TokenRefresh, UserResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registers a new user account.
    """
    return AuthService.register_user(db=db, user_in=user_in, request=request)


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials and issues JWT Access & Refresh Tokens.
    """
    _, token = AuthService.authenticate_user(db=db, login_data=login_data, request=request)
    return token


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_in: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Exchanges a valid Refresh Token for a fresh Access Token.
    """
    return AuthService.refresh_access_token(db=db, refresh_token=token_in.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logs out the current user and invalidates session status.
    """
    AuthService.logout_user(db=db, user=current_user, request=request)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the authenticated user's profile details.
    """
    return current_user
