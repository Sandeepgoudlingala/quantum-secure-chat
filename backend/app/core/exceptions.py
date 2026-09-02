"""
Custom Domain & HTTP Security Exceptions Module.
Standardizes error response payloads and exception hierarchy across the application.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class PQCSystemException(Exception):
    """Base exception for PQC domain errors."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class CryptoException(PQCSystemException):
    """Raised when cryptographic key exchange or AES decryption fails."""
    pass


class InvalidKeyException(CryptoException):
    """Raised when an invalid public key or session key is supplied."""
    pass


class DecryptionFailedException(CryptoException):
    """Raised when payload integrity verification or AES-256-GCM authentication tag check fails."""
    pass


# HTTP Exception Utilities
class CredentialsException(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "Permission denied for this resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class ResourceNotFoundException(HTTPException):
    def __init__(self, detail: str = "Requested resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class BadRequestException(HTTPException):
    def __init__(self, detail: str = "Bad Request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )
