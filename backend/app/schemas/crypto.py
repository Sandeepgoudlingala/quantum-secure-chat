"""
Cryptographic Operations Pydantic Schemas.
Data Transfer Objects for ML-KEM Key Exchange, Handshake Signals, and AES Ciphertext Payloads.
"""

from typing import Optional
from pydantic import BaseModel, Field


class KeyPairResponse(BaseModel):
    public_key: str = Field(..., description="Base64 encoded ML-KEM-768 Public Key")
    secret_key: Optional[str] = Field(None, description="Base64 encoded ML-KEM-768 Secret Key (Client side storage)")
    parameter_set: str = "ML-KEM-768"


class KeyExchangeInitRequest(BaseModel):
    recipient_id: str = Field(..., description="Recipient user UUID")
    sender_public_key: str = Field(..., description="Base64 encoded sender public key")


class KeyExchangeEncapsulateRequest(BaseModel):
    recipient_id: str = Field(..., description="Target user UUID")
    recipient_public_key: str = Field(..., description="Base64 recipient public key")


class KeyExchangeEncapsulateResponse(BaseModel):
    kem_ciphertext: str = Field(..., description="Base64 encoded encapsulated ciphertext C_kem")
    shared_secret: str = Field(..., description="Base64 encoded 256-bit derived shared secret")


class KeyExchangeDecapsulateRequest(BaseModel):
    kem_ciphertext: str = Field(..., description="Base64 encoded ciphertext C_kem")
    secret_key: str = Field(..., description="Base64 encoded recipient secret key")


class KeyExchangeDecapsulateResponse(BaseModel):
    shared_secret: str = Field(..., description="Base64 encoded recovered shared secret")


class AESEncryptRequest(BaseModel):
    plaintext: str = Field(..., description="Plaintext content to encrypt")
    session_key: Optional[str] = Field(None, description="Base64 encoded 256-bit AES key")
    key: Optional[str] = Field(None, description="Alias for session_key")

    def get_key(self) -> str:
        k = self.session_key or self.key
        if not k:
            raise ValueError("session_key or key is required")
        return k


class AESEncryptResponse(BaseModel):
    ciphertext: str = Field(..., description="Base64 AES-256-GCM Ciphertext")
    iv: str = Field(..., description="Base64 96-bit IV")
    auth_tag: str = Field(..., description="Base64 128-bit Auth Tag")
    sha256_hash: str = Field(..., description="Hex SHA-256 Digest of plaintext")


class AESDecryptRequest(BaseModel):
    ciphertext: str = Field(..., description="Base64 AES-256-GCM Ciphertext")
    session_key: Optional[str] = Field(None, description="Base64 256-bit AES Key")
    key: Optional[str] = Field(None, description="Alias for session_key")
    iv: str = Field(..., description="Base64 96-bit IV")
    auth_tag: str = Field(..., description="Base64 128-bit Tag")

    def get_key(self) -> str:
        k = self.session_key or self.key
        if not k:
            raise ValueError("session_key or key is required")
        return k


class AESDecryptResponse(BaseModel):
    plaintext: str = Field(..., description="Decrypted UTF-8 string payload")
    integrity_verified: bool = True

