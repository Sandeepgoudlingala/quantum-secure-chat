"""
Cryptographic Operations REST API Endpoints.
Exposes ML-KEM-768 key generation, key encapsulation/decapsulation, and AES-256-GCM encryption endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.crypto import (
    KeyPairResponse,
    KeyExchangeEncapsulateRequest,
    KeyExchangeEncapsulateResponse,
    KeyExchangeDecapsulateRequest,
    KeyExchangeDecapsulateResponse,
    AESEncryptRequest,
    AESEncryptResponse,
    AESDecryptRequest,
    AESDecryptResponse,
)
from app.crypto.aes_gcm import AES256GCMEngine
from app.services.crypto_service import CryptoService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/crypto", tags=["Post-Quantum Cryptography"])


@router.post("/generate-keypair", response_model=KeyPairResponse)
def generate_keypair(
    current_user: User = Depends(get_current_user)
):
    """
    Generates a fresh ML-KEM-768 (Kyber-768) public/secret keypair.
    """
    return CryptoService.generate_ml_kem_keypair()


@router.post("/encapsulate", response_model=KeyExchangeEncapsulateResponse)
def encapsulate_key(
    req: KeyExchangeEncapsulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Encapsulates a shared secret using recipient's ML-KEM public key,
    returning ciphertext C_kem and derived AES-256 session key.
    """
    res = CryptoService.encapsulate_shared_secret(
        db=db,
        sender_id=current_user.id,
        recipient_id=req.recipient_id,
        recipient_public_key_b64=req.recipient_public_key
    )
    return KeyExchangeEncapsulateResponse(
        kem_ciphertext=res["kem_ciphertext"],
        shared_secret=res["shared_secret"]
    )


@router.post("/decapsulate", response_model=KeyExchangeDecapsulateResponse)
def decapsulate_key(
    req: KeyExchangeDecapsulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Decapsulates ML-KEM ciphertext using user's secret key to reconstruct shared AES-256 session key.
    """
    shared_secret_b64 = CryptoService.decapsulate_shared_secret(
        db=db,
        recipient_id=current_user.id,
        kem_ciphertext_b64=req.kem_ciphertext,
        secret_key_b64=req.secret_key
    )
    return KeyExchangeDecapsulateResponse(shared_secret=shared_secret_b64)


@router.post("/encrypt", response_model=AESEncryptResponse)
@router.post("/aes/encrypt", response_model=AESEncryptResponse)
def aes_encrypt(
    req: AESEncryptRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Encrypts a string message using AES-256-GCM symmetric encryption.
    """
    session_key_bytes = AES256GCMEngine.b64_decode(req.get_key())
    ciphertext, iv, auth_tag = AES256GCMEngine.encrypt(req.plaintext, session_key_bytes)
    sha256_hash = AES256GCMEngine.compute_sha256_digest(req.plaintext.encode('utf-8'))

    return AESEncryptResponse(
        ciphertext=AES256GCMEngine.b64_encode(ciphertext),
        iv=AES256GCMEngine.b64_encode(iv),
        auth_tag=AES256GCMEngine.b64_encode(auth_tag),
        sha256_hash=sha256_hash
    )


@router.post("/decrypt", response_model=AESDecryptResponse)
@router.post("/aes/decrypt", response_model=AESDecryptResponse)
def aes_decrypt(
    req: AESDecryptRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Decrypts an AES-256-GCM payload and verifies its 128-bit authentication tag.
    """
    session_key_bytes = AES256GCMEngine.b64_decode(req.get_key())
    ciphertext_bytes = AES256GCMEngine.b64_decode(req.ciphertext)
    iv_bytes = AES256GCMEngine.b64_decode(req.iv)
    auth_tag_bytes = AES256GCMEngine.b64_decode(req.auth_tag)

    plaintext_bytes = AES256GCMEngine.decrypt(
        ciphertext=ciphertext_bytes,
        key=session_key_bytes,
        iv=iv_bytes,
        auth_tag=auth_tag_bytes
    )

    return AESDecryptResponse(
        plaintext=plaintext_bytes.decode('utf-8'),
        integrity_verified=True
    )

