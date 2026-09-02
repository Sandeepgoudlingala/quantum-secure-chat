"""
AES-256-GCM Authenticated Encryption & Decryption Module.
Implements NIST FIPS 197 standard AES-256 Galois/Counter Mode (GCM) symmetric cryptography.

Features:
- Cryptographically secure 96-bit (12-byte) IV generation
- 128-bit (16-byte) Authentication Tag verification
- Zero-Plaintext handling
- SHA-256 payload integrity hash computation
"""

import base64
import hashlib
import secrets
from typing import Dict, Tuple, Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.exceptions import CryptoException, DecryptionFailedException
from app.core.app_logging import logger


class AES256GCMEngine:
    """
    FIPS 197 Compliant AES-256-GCM Symmetric Encryption Engine.
    """

    KEY_SIZE = 32   # 256 bits
    IV_SIZE = 12    # 96 bits (NIST recommended GCM IV size)
    TAG_SIZE = 16   # 128 bits authentication tag

    @classmethod
    def generate_random_iv(cls) -> bytes:
        """Generates a 96-bit (12-byte) cryptographically secure random IV."""
        return secrets.token_bytes(cls.IV_SIZE)

    @classmethod
    def generate_session_key(cls) -> bytes:
        """Generates a standalone random 256-bit AES key."""
        return secrets.token_bytes(cls.KEY_SIZE)

    @classmethod
    def compute_sha256_digest(cls, data: bytes) -> str:
        """Computes SHA-256 hex digest for post-decryption payload integrity verification."""
        return hashlib.sha256(data).hexdigest()

    @classmethod
    def encrypt(cls, plaintext: Union[str, bytes], key: bytes, associated_data: bytes = None) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypts plaintext using AES-256-GCM.
        Args:
            plaintext (str | bytes): Plaintext message or file binary bytes.
            key (bytes): 32-byte (256-bit) AES session key.
            associated_data (bytes, optional): Optional AAD payload.
        Returns:
            Tuple[bytes, bytes, bytes]: (ciphertext_bytes, iv_bytes, auth_tag_bytes)
        """
        if len(key) != cls.KEY_SIZE:
            raise CryptoException(f"Invalid AES-256 key length. Expected {cls.KEY_SIZE} bytes, got {len(key)}")

        if isinstance(plaintext, str):
            data_bytes = plaintext.encode('utf-8')
        else:
            data_bytes = plaintext

        iv = cls.generate_random_iv()

        try:
            aesgcm = AESGCM(key)
            # cryptography library's encrypt returns ciphertext + tag appended at the end
            ct_with_tag = aesgcm.encrypt(iv, data_bytes, associated_data)
            
            ciphertext = ct_with_tag[:-cls.TAG_SIZE]
            auth_tag = ct_with_tag[-cls.TAG_SIZE:]

            return ciphertext, iv, auth_tag
        except Exception as e:
            logger.error(f"AES-256-GCM encryption failed: {str(e)}")
            raise CryptoException(f"Encryption failed: {str(e)}")

    @classmethod
    def decrypt(
        cls,
        ciphertext: bytes,
        key: bytes,
        iv: bytes,
        auth_tag: bytes,
        associated_data: bytes = None
    ) -> bytes:
        """
        Decrypts AES-256-GCM ciphertext and validates the 128-bit authentication tag.
        Args:
            ciphertext (bytes): Encrypted payload bytes.
            key (bytes): 32-byte AES session key.
            iv (bytes): 12-byte IV.
            auth_tag (bytes): 16-byte authentication tag.
            associated_data (bytes, optional): Optional AAD payload.
        Returns:
            bytes: Decrypted plaintext bytes.
        """
        if len(key) != cls.KEY_SIZE:
            raise CryptoException(f"Invalid key length: {len(key)}")
        if len(iv) != cls.IV_SIZE:
            raise CryptoException(f"Invalid IV length: {len(iv)}")
        if len(auth_tag) != cls.TAG_SIZE:
            raise CryptoException(f"Invalid authentication tag length: {len(auth_tag)}")

        try:
            aesgcm = AESGCM(key)
            ct_with_tag = ciphertext + auth_tag
            plaintext = aesgcm.decrypt(iv, ct_with_tag, associated_data)
            return plaintext
        except Exception as e:
            logger.warning(f"AES-256-GCM Authentication Tag Verification Failed: {str(e)}")
            raise DecryptionFailedException("Payload integrity verification failed or invalid key/tag.")

    # Base64 Utility Methods
    @classmethod
    def b64_encode(cls, data: bytes) -> str:
        return base64.b64encode(data).decode('utf-8')

    @classmethod
    def b64_decode(cls, data_str: str) -> bytes:
        try:
            return base64.b64decode(data_str.encode('utf-8'))
        except Exception as e:
            raise CryptoException(f"Base64 decoding failed: {str(e)}")
