"""
HKDF Key Derivation Module.
Uses HKDF-SHA256 (HMAC-based Extract-and-Expand Key Derivation Function)
to derive symmetric AES-256 session keys from ML-KEM shared secrets.
"""

from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from app.core.exceptions import CryptoException
from app.core.app_logging import logger


class KeyDerivationEngine:
    """
    HKDF-SHA256 Engine mapping raw ML-KEM shared secrets to AES-256 session keys.
    """

    CONTEXT_INFO = b"PQC-MLKEM-AES256-GCM-SESSION-KEY-V1"

    @classmethod
    def derive_aes_256_key(cls, shared_secret: bytes, salt: bytes = None) -> bytes:
        """
        Derives a 256-bit (32-byte) AES symmetric key from an ML-KEM shared secret.
        Args:
            shared_secret (bytes): 32-byte shared secret from ML-KEM encapsulation/decapsulation.
            salt (bytes, optional): Optional cryptographic salt.
        Returns:
            bytes: 32-byte AES-256 session key.
        """
        if len(shared_secret) != 32:
            raise CryptoException(f"Invalid shared secret length for HKDF. Expected 32 bytes, got {len(shared_secret)}")

        if salt is None:
            salt = b"PQC_CAPSTONE_SALT_FIPS203"

        try:
            hkdf = HKDF(
                algorithm=hashes.SHA256(),
                length=32,  # 256 bits
                salt=salt,
                info=cls.CONTEXT_INFO,
            )
            aes_key = hkdf.derive(shared_secret)
            return aes_key
        except Exception as e:
            logger.error(f"HKDF key derivation failure: {str(e)}")
            raise CryptoException(f"Failed to derive session key: {str(e)}")
