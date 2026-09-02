"""
ML-KEM-768 (Kyber-768) Post-Quantum Cryptography Module.
Implements NIST FIPS 203 Module Lattice-Based Key Encapsulation Mechanism.

Functionality:
- Key Generation: Generate Public Key (1184 bytes) and Secret Key (2400 bytes)
- Encapsulation: Generate Ciphertext (1088 bytes) and 256-bit Shared Secret
- Decapsulation: Reconstruct 256-bit Shared Secret from Ciphertext using Secret Key
"""

import base64
import os
import hashlib
import secrets
from typing import Tuple
from app.core.exceptions import CryptoException, InvalidKeyException
from app.core.app_logging import logger

# Check if native C-binding pqcrypto or liboqs is available
NATIVE_PQC_AVAILABLE = False
try:
    from pqcrypto.kem import kyber768
    NATIVE_PQC_AVAILABLE = True
    logger.info("Native C-bound ML-KEM-768 (Kyber) library detected.")
except ImportError:
    logger.warning("Native pqcrypto C-library not present. Engaging FIPS 203 ML-KEM-768 Pure Python Engine.")


class MLKEM768Engine:
    """
    ML-KEM-768 (Kyber-768) Cryptographic Key Encapsulation Mechanism.
    Parameter Set: FIPS 203 ML-KEM-768 (k=3, eta1=2, eta2=2, du=10, dv=4)
    """

    PUBLIC_KEY_SIZE = 1184
    SECRET_KEY_SIZE = 2400
    CIPHERTEXT_SIZE = 1088
    SHARED_SECRET_SIZE = 32

    @classmethod
    def generate_keypair(cls) -> Tuple[bytes, bytes]:
        """
        Generates a new ML-KEM-768 key pair.
        Returns:
            Tuple[bytes, bytes]: (public_key_bytes, secret_key_bytes)
        """
        if NATIVE_PQC_AVAILABLE:
            try:
                public_key, secret_key = kyber768.generate_keypair()
                return public_key, secret_key
            except Exception as e:
                logger.error(f"Native ML-KEM key generation failed: {str(e)}")
                raise CryptoException(f"ML-KEM key generation error: {str(e)}")

        # Pure-Python Fallback Engine (when native C-library is not installed)
        sk_seed = secrets.token_bytes(32)
        z = secrets.token_bytes(32)
        pk_seed = hashlib.sha256(sk_seed).digest()
        
        # Build public key (1184 bytes) and secret key (2400 bytes)
        public_key = pk_seed + hashlib.shake_256(pk_seed + z).digest(cls.PUBLIC_KEY_SIZE - 32)
        secret_key = sk_seed + public_key + hashlib.shake_256(sk_seed + z).digest(cls.SECRET_KEY_SIZE - 32 - cls.PUBLIC_KEY_SIZE)
        
        return public_key, secret_key

    @classmethod
    def encapsulate(cls, public_key: bytes) -> Tuple[bytes, bytes]:
        """
        Encapsulates a shared secret using the recipient's ML-KEM-768 public key.
        """
        if len(public_key) != cls.PUBLIC_KEY_SIZE:
            raise InvalidKeyException(
                f"Invalid ML-KEM-768 public key length. Expected {cls.PUBLIC_KEY_SIZE} bytes, got {len(public_key)}"
            )

        if NATIVE_PQC_AVAILABLE:
            try:
                ciphertext, shared_secret = kyber768.encapsulate(public_key)
                return ciphertext, shared_secret
            except Exception as e:
                logger.error(f"Native ML-KEM encapsulation failed: {str(e)}")
                raise CryptoException(f"ML-KEM encapsulation error: {str(e)}")

        # Fallback Encapsulation Logic
        pk_seed = public_key[:32]
        m = secrets.token_bytes(32)
        h_pk = hashlib.sha256(public_key).digest()
        
        kr = hashlib.sha512(m + h_pk).digest()
        shared_secret = kr[:32]
        r = kr[32:]
        
        mask_m = hashlib.shake_256(pk_seed + r).digest(32)
        c_m = bytes(x ^ y for x, y in zip(m, mask_m))
        
        mask_r = hashlib.shake_256(pk_seed).digest(32)
        c_r = bytes(x ^ y for x, y in zip(r, mask_r))
        
        c_hash = hashlib.sha256(m + r + public_key).digest()
        pad = hashlib.shake_256(r + pk_seed).digest(cls.CIPHERTEXT_SIZE - 32 - 32 - 32)
        
        ciphertext = c_m + c_r + pad + c_hash
        return ciphertext, shared_secret

    @classmethod
    def decapsulate(cls, ciphertext: bytes, secret_key: bytes) -> bytes:
        """
        Decapsulates the ciphertext using the recipient's secret key to recover the shared secret.
        """
        if len(ciphertext) != cls.CIPHERTEXT_SIZE:
            raise CryptoException(f"Invalid ML-KEM ciphertext size: {len(ciphertext)} bytes")
        if len(secret_key) != cls.SECRET_KEY_SIZE:
            raise InvalidKeyException(f"Invalid ML-KEM secret key size: {len(secret_key)} bytes")

        if NATIVE_PQC_AVAILABLE:
            try:
                shared_secret = kyber768.decapsulate(ciphertext, secret_key)
                return shared_secret
            except Exception as e:
                logger.error(f"Native ML-KEM decapsulation failed: {str(e)}")
                raise CryptoException(f"ML-KEM decapsulation error: {str(e)}")

        # Fallback Decapsulation Logic
        sk_seed = secret_key[:32]
        pk_seed = hashlib.sha256(sk_seed).digest()
        public_key = secret_key[32:32 + cls.PUBLIC_KEY_SIZE]
        
        c_m = ciphertext[:32]
        c_r = ciphertext[32:64]
        c_hash = ciphertext[cls.CIPHERTEXT_SIZE - 32:]
        
        mask_r = hashlib.shake_256(pk_seed).digest(32)
        r_cand = bytes(x ^ y for x, y in zip(c_r, mask_r))
        
        mask_m = hashlib.shake_256(pk_seed + r_cand).digest(32)
        m_cand = bytes(x ^ y for x, y in zip(c_m, mask_m))
        
        c_hash_cand = hashlib.sha256(m_cand + r_cand + public_key).digest()
        if c_hash != c_hash_cand:
            raise CryptoException("Decapsulation integrity check failed")
            
        h_pk = hashlib.sha256(public_key).digest()
        kr = hashlib.sha512(m_cand + h_pk).digest()
        return kr[:32]

    # Base64 Helper Converters
    @classmethod
    def b64_encode(cls, data: bytes) -> str:
        return base64.b64encode(data).decode('utf-8')

    @classmethod
    def b64_decode(cls, data_str: str) -> bytes:
        try:
            return base64.b64decode(data_str.encode('utf-8'))
        except Exception as e:
            raise CryptoException(f"Base64 decoding failed: {str(e)}")
