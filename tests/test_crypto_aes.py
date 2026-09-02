"""
AES-256-GCM Symmetric Cryptography Unit Tests.
Verifies random IV generation, authenticated payload encryption/decryption, and tampered tag rejection.
"""

import pytest
from app.crypto.aes_gcm import AES256GCMEngine
from app.core.exceptions import DecryptionFailedException


def test_aes_256_gcm_encrypt_decrypt():
    session_key = AES256GCMEngine.generate_session_key()
    plaintext = "Top Secret Hybrid Quantum Encrypted Payload 123!"

    ciphertext, iv, auth_tag = AES256GCMEngine.encrypt(plaintext, session_key)
    assert len(iv) == 12
    assert len(auth_tag) == 16

    decrypted_bytes = AES256GCMEngine.decrypt(
        ciphertext=ciphertext,
        key=session_key,
        iv=iv,
        auth_tag=auth_tag
    )

    assert decrypted_bytes.decode('utf-8') == plaintext


def test_aes_256_gcm_tampered_auth_tag_failure():
    session_key = AES256GCMEngine.generate_session_key()
    plaintext = "Authenticity Verification Payload"

    ciphertext, iv, auth_tag = AES256GCMEngine.encrypt(plaintext, session_key)
    
    # Tamper with authentication tag byte
    tampered_tag = bytearray(auth_tag)
    tampered_tag[0] ^= 0xFF

    with pytest.raises(DecryptionFailedException):
        AES256GCMEngine.decrypt(
            ciphertext=ciphertext,
            key=session_key,
            iv=iv,
            auth_tag=bytes(tampered_tag)
        )


def test_sha256_hash_digest():
    data = b"Post-Quantum File Payload Bytes"
    hash1 = AES256GCMEngine.compute_sha256_digest(data)
    hash2 = AES256GCMEngine.compute_sha256_digest(data)
    assert len(hash1) == 64
    assert hash1 == hash2
