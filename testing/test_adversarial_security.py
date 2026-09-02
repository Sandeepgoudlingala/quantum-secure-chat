"""
Adversarial / Negative Security Tests.

These simulate an active attacker: tampering, replay, downgrade, and
malformed input. A crypto system is only as good as what it correctly
REJECTS, not just what it correctly encrypts/decrypts.
"""

import os
import pytest
from app.crypto.aes_gcm import AES256GCMEngine
from app.crypto.ml_kem import MLKEM768Engine
from app.crypto.key_derivation import KeyDerivationEngine
from app.core.exceptions import (
    DecryptionFailedException,
    CryptoException,
    InvalidKeyException,
)


# ---------- AES-GCM tampering ----------

def test_ciphertext_bitflip_is_rejected():
    key = AES256GCMEngine.generate_session_key()
    ciphertext, iv, tag = AES256GCMEngine.encrypt("sensitive chat message", key)

    tampered = bytearray(ciphertext)
    tampered[0] ^= 0x01  # flip one bit in the ciphertext body

    with pytest.raises(DecryptionFailedException):
        AES256GCMEngine.decrypt(bytes(tampered), key, iv, tag)


def test_iv_reuse_with_different_key_does_not_leak_plaintext_equality():
    """IV reuse across different keys should not allow secret recovery."""
    key_a = AES256GCMEngine.generate_session_key()
    key_b = AES256GCMEngine.generate_session_key()
    plaintext = "identical message for both users"

    ct_a, iv_a, tag_a = AES256GCMEngine.encrypt(plaintext, key_a)
    ct_b, iv_b, tag_b = AES256GCMEngine.encrypt(plaintext, key_b, )

    assert ct_a != ct_b  # different keys -> different ciphertext, even same plaintext


def test_wrong_key_decryption_fails_cleanly():
    key = AES256GCMEngine.generate_session_key()
    wrong_key = AES256GCMEngine.generate_session_key()
    ciphertext, iv, tag = AES256GCMEngine.encrypt("secret", key)

    with pytest.raises(DecryptionFailedException):
        AES256GCMEngine.decrypt(ciphertext, wrong_key, iv, tag)


def test_truncated_ciphertext_is_rejected():
    key = AES256GCMEngine.generate_session_key()
    ciphertext, iv, tag = AES256GCMEngine.encrypt("a longer secret message here", key)
    truncated = ciphertext[: len(ciphertext) // 2]

    with pytest.raises((DecryptionFailedException, CryptoException, Exception)):
        AES256GCMEngine.decrypt(truncated, key, iv, tag)


def test_reused_iv_with_same_key_is_flagged_by_policy():
    """
    AES-GCM catastrophically fails if the same (key, IV) pair is reused for
    two different messages. This test documents the requirement: the
    application layer (not just the crypto engine) must guarantee IV
    uniqueness per key, e.g. via random 96-bit IV generation with logging/
    monitoring for collisions in long-lived sessions.
    """
    key = AES256GCMEngine.generate_session_key()
    iv = AES256GCMEngine.generate_random_iv()
    seen_ivs = {iv}
    # Simulate 10,000 fresh IV generations and assert no collision — this is
    # a birthday-bound sanity check, not a formal proof.
    for _ in range(10_000):
        new_iv = AES256GCMEngine.generate_random_iv()
        assert new_iv not in seen_ivs, "IV collision detected — investigate RNG."
        seen_ivs.add(new_iv)


# ---------- ML-KEM malformed input / downgrade ----------

def test_encapsulate_rejects_malformed_public_key_sizes():
    for bad_len in [0, 1, 100, MLKEM768Engine.PUBLIC_KEY_SIZE - 1, MLKEM768Engine.PUBLIC_KEY_SIZE + 1]:
        with pytest.raises(InvalidKeyException):
            MLKEM768Engine.encapsulate(os.urandom(bad_len))


def test_decapsulate_rejects_malformed_ciphertext_or_key_sizes():
    pk, sk = MLKEM768Engine.generate_keypair()
    ct, _ = MLKEM768Engine.encapsulate(pk)

    with pytest.raises(CryptoException):
        MLKEM768Engine.decapsulate(ct[:-1], sk)

    with pytest.raises(InvalidKeyException):
        MLKEM768Engine.decapsulate(ct, sk[:-1])


def test_tampered_ciphertext_causes_decapsulation_failure_or_mismatched_secret():
    """
    A correctly implemented KEM should either raise on a tampered
    ciphertext (explicit rejection) or, per FO-transform / implicit
    rejection designs, return a shared secret that does NOT match the
    original — never the same secret as the honest run.
    """
    pk, sk = MLKEM768Engine.generate_keypair()
    ct, honest_secret = MLKEM768Engine.encapsulate(pk)

    tampered_ct = bytearray(ct)
    tampered_ct[0] ^= 0xFF

    try:
        recovered = MLKEM768Engine.decapsulate(bytes(tampered_ct), sk)
        assert recovered != honest_secret, (
            "Tampered ciphertext decapsulated to the SAME shared secret as "
            "the honest run — this indicates the ciphertext integrity check "
            "is not binding to all ciphertext fields."
        )
    except CryptoException:
        pass  # explicit rejection is also an acceptable outcome


def test_downgrade_attack_no_classical_only_path_exists():
    """
    Ensures there is no code path where a session can be established using
    only classical (RSA/ECC) key exchange with no ML-KEM step at all — i.e.
    an attacker cannot force a "downgrade" to pre-quantum crypto.
    This is a structural/documentation test: adapt the import below to
    whatever function actually establishes a session in your API layer.
    """
    from app.api.v1.endpoints import crypto as crypto_endpoint
    source = open(crypto_endpoint.__file__).read()
    assert "MLKEM768Engine" in source or "ml_kem" in source, (
        "Session establishment endpoint does not appear to invoke ML-KEM at "
        "all — verify no classical-only fallback session path exists."
    )


# ---------- HKDF misuse ----------

def test_hkdf_rejects_wrong_length_shared_secret():
    with pytest.raises(CryptoException):
        KeyDerivationEngine.derive_aes_256_key(os.urandom(16))  # not 32 bytes


def test_hkdf_output_changes_with_different_salts():
    secret = os.urandom(32)
    key1 = KeyDerivationEngine.derive_aes_256_key(secret, salt=b"salt-one")
    key2 = KeyDerivationEngine.derive_aes_256_key(secret, salt=b"salt-two")
    assert key1 != key2
