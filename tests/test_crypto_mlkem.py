"""
ML-KEM-768 (Kyber-768) Cryptographic Unit Tests.
Verifies key generation length, encapsulation/decapsulation roundtrip correctness, and shared secret matching.
"""

import pytest
from app.crypto.ml_kem import MLKEM768Engine
from app.crypto.key_derivation import KeyDerivationEngine
from app.core.exceptions import InvalidKeyException


def test_ml_kem_keypair_generation():
    pk, sk = MLKEM768Engine.generate_keypair()
    assert len(pk) == MLKEM768Engine.PUBLIC_KEY_SIZE
    assert len(sk) == MLKEM768Engine.SECRET_KEY_SIZE


def test_ml_kem_encapsulation_decapsulation_roundtrip():
    # 1. Receiver generates keypair
    pk_b, sk_b = MLKEM768Engine.generate_keypair()

    # 2. Sender encapsulates using pk_b
    ciphertext, sender_shared_secret = MLKEM768Engine.encapsulate(pk_b)
    assert len(ciphertext) == MLKEM768Engine.CIPHERTEXT_SIZE
    assert len(sender_shared_secret) == MLKEM768Engine.SHARED_SECRET_SIZE

    # 3. Receiver decapsulates using ciphertext & sk_b
    receiver_shared_secret = MLKEM768Engine.decapsulate(ciphertext, sk_b)

    # 4. Verify shared secret parity
    assert sender_shared_secret == receiver_shared_secret

    # 5. HKDF session key derivation parity test
    sender_aes_key = KeyDerivationEngine.derive_aes_256_key(sender_shared_secret)
    receiver_aes_key = KeyDerivationEngine.derive_aes_256_key(receiver_shared_secret)

    assert len(sender_aes_key) == 32
    assert sender_aes_key == receiver_aes_key


def test_ml_kem_invalid_public_key():
    invalid_pk = b"short_key"
    with pytest.raises(InvalidKeyException):
        MLKEM768Engine.encapsulate(invalid_pk)
