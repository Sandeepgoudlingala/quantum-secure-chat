"""
Cryptographic Service Layer.
Coordinates ML-KEM-768 key exchanges, session key derivations via HKDF, AES-256-GCM operations,
and audit trail generation for cryptographic handshakes.
"""

from typing import Dict, Tuple
from sqlalchemy.orm import Session
from app.crypto.ml_kem import MLKEM768Engine
from app.crypto.key_derivation import KeyDerivationEngine
from app.crypto.aes_gcm import AES256GCMEngine
from app.models.session_key import SessionKey
from app.models.user import User
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, CryptoException
from app.core.app_logging import logger


class CryptoService:

    @staticmethod
    def generate_ml_kem_keypair() -> Dict[str, str]:
        """
        Generates a new ML-KEM-768 public and secret key pair encoded in Base64.
        """
        pk_bytes, sk_bytes = MLKEM768Engine.generate_keypair()
        return {
            "public_key": MLKEM768Engine.b64_encode(pk_bytes),
            "secret_key": MLKEM768Engine.b64_encode(sk_bytes),
            "parameter_set": "ML-KEM-768",
        }

    @staticmethod
    def encapsulate_shared_secret(
        db: Session,
        sender_id: str,
        recipient_id: str,
        recipient_public_key_b64: str
    ) -> Dict[str, str]:
        """
        Encapsulates a secret using the recipient's ML-KEM-768 public key,
        derives a 256-bit AES session key using HKDF-SHA256, and records a SessionKey record.
        """
        pk_bytes = MLKEM768Engine.b64_decode(recipient_public_key_b64)
        ciphertext_bytes, raw_shared_secret = MLKEM768Engine.encapsulate(pk_bytes)

        # Derive AES-256 session key using HKDF-SHA256
        aes_session_key = KeyDerivationEngine.derive_aes_256_key(raw_shared_secret)

        kem_ciphertext_b64 = MLKEM768Engine.b64_encode(ciphertext_bytes)
        aes_key_b64 = MLKEM768Engine.b64_encode(aes_session_key)

        # Persist session key negotiation in DB
        session_record = SessionKey(
            sender_id=sender_id,
            receiver_id=recipient_id,
            kem_ciphertext=kem_ciphertext_b64,
            status="ESTABLISHED"
        )
        db.add(session_record)
        db.commit()
        db.refresh(session_record)

        # Audit log key exchange initiation & completion
        AuditService.log_event(
            db=db,
            event_type="KEY_EXCHANGE_COMPLETE",
            user_id=sender_id,
            details={"recipient_id": recipient_id, "session_key_id": session_record.id}
        )

        logger.info(f"PQC Handshake completed between Sender: {sender_id} and Recipient: {recipient_id}")

        return {
            "kem_ciphertext": kem_ciphertext_b64,
            "shared_secret": aes_key_b64,
            "session_key_id": session_record.id
        }

    @staticmethod
    def decapsulate_shared_secret(
        db: Session,
        recipient_id: str,
        kem_ciphertext_b64: str,
        secret_key_b64: str
    ) -> str:
        """
        Decapsulates ML-KEM ciphertext using recipient's secret key and derives AES-256 session key via HKDF.
        """
        ct_bytes = MLKEM768Engine.b64_decode(kem_ciphertext_b64)
        sk_bytes = MLKEM768Engine.b64_decode(secret_key_b64)

        raw_shared_secret = MLKEM768Engine.decapsulate(ct_bytes, sk_bytes)
        aes_session_key = KeyDerivationEngine.derive_aes_256_key(raw_shared_secret)

        AuditService.log_event(
            db=db,
            event_type="KEY_DECAPSULATION_SUCCESS",
            user_id=recipient_id,
            details={"algorithm": "ML-KEM-768"}
        )

        return MLKEM768Engine.b64_encode(aes_session_key)
