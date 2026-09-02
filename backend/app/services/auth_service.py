"""
Authentication Business Logic Service.
Handles user registration, login authentication, token refresh, password changes, and security audit log integration.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException, status

from sqlalchemy import func, or_
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import BadRequestException, CredentialsException
from app.services.audit_service import AuditService
from app.core.app_logging import logger


class AuthService:

    @staticmethod
    def register_user(db: Session, user_in: UserRegister, request: Optional[Request] = None) -> User:
        """Registers a new user after verifying unique constraints and hashing password."""
        clean_username = user_in.username.strip()
        clean_email = user_in.email.strip().lower()

        # Check existing username
        if db.query(User).filter(func.lower(User.username) == clean_username.lower()).first():
            raise BadRequestException(detail="Username is already registered")

        # Check existing email
        if db.query(User).filter(func.lower(User.email) == clean_email).first():
            raise BadRequestException(detail="Email address is already registered")

        # Hash password using bcrypt
        hashed_pwd = hash_password(user_in.password)

        new_user = User(
            username=clean_username,
            email=clean_email,
            hashed_password=hashed_pwd,
            is_active=True,
            is_online=False,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Audit log registration
        ip_addr = request.client.host if request and request.client else "unknown"
        u_agent = request.headers.get("user-agent") if request else "unknown"
        AuditService.log_event(
            db=db,
            event_type="REGISTER_SUCCESS",
            user_id=new_user.id,
            ip_address=ip_addr,
            user_agent=u_agent,
            details={"username": new_user.username, "email": new_user.email}
        )

        logger.info(f"New user registered: {new_user.username} (ID: {new_user.id})")
        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin, request: Optional[Request] = None) -> Tuple[User, Token]:
        """Authenticates user credentials, updates online state, logs audit event, and issues JWT tokens."""
        ip_addr = request.client.host if request and request.client else "unknown"
        u_agent = request.headers.get("user-agent") if request else "unknown"

        identifier = (login_data.email_or_username or "").strip()
        password = login_data.password or ""

        # Search user by email or username (case-insensitive & trimmed)
        user = db.query(User).filter(
            or_(
                func.lower(User.username) == identifier.lower(),
                func.lower(User.email) == identifier.lower()
            )
        ).first()

        pwd_valid = False
        if user:
            pwd_valid = verify_password(password, user.hashed_password)
            if not pwd_valid and password.strip() != password:
                pwd_valid = verify_password(password.strip(), user.hashed_password)

        if not user or not pwd_valid:
            # Record failed login audit log
            AuditService.log_event(
                db=db,
                event_type="LOGIN_FAILED",
                user_id=user.id if user else None,
                ip_address=ip_addr,
                user_agent=u_agent,
                details={"attempted_identifier": identifier}
            )
            raise CredentialsException(detail="Incorrect username/email or password")


        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

        # Update online status
        user.is_online = True
        user.last_seen = datetime.now(timezone.utc)
        db.commit()

        # Issue Tokens
        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        token_payload = Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        # Audit log success
        AuditService.log_event(
            db=db,
            event_type="LOGIN_SUCCESS",
            user_id=user.id,
            ip_address=ip_addr,
            user_agent=u_agent,
            details={"username": user.username}
        )

        return user, token_payload

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Token:
        """Validates refresh token and issues a new access token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise CredentialsException(detail="Invalid token type for refresh operation")

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise CredentialsException(detail="User not found or inactive")

        new_access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    @staticmethod
    def logout_user(db: Session, user: User, request: Optional[Request] = None) -> None:
        """Logs out user, updates online state, and records audit entry."""
        user.is_online = False
        user.last_seen = datetime.now(timezone.utc)
        db.commit()

        ip_addr = request.client.host if request and request.client else "unknown"
        u_agent = request.headers.get("user-agent") if request else "unknown"

        AuditService.log_event(
            db=db,
            event_type="LOGOUT",
            user_id=user.id,
            ip_address=ip_addr,
            user_agent=u_agent
        )
