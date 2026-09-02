"""
NIST Known-Answer-Test (KAT) Validation for ML-KEM-768.

This is the strongest evidence you can present in a capstone report:
proof that your ML-KEM-768 implementation produces byte-exact results
against NIST's official test vectors, not just "internally consistent"
results (which the fake fallback engine would also pass).

HOW TO GET REAL VECTORS:
1. Download the official ACVP / NIST test vectors for ML-KEM-768 from:
   https://github.com/usnistgov/ACVP-Server  (search "ML-KEM" test vectors)
   or the CAVP tool output for FIPS 203.
2. Place the JSON/RSP file at: tests/vectors/mlkem768_kat.json
3. Fill in `load_kat_vectors()` below to parse that file's schema.

This test file is written to SKIP (not fail) if the vector file is
missing, so it doesn't break CI before you've sourced the vectors —
but for your final report, this must actually run and pass.
"""

import json
import os
import pytest

VECTOR_PATH = os.path.join(os.path.dirname(__file__), "vectors", "mlkem768_kat.json")

pytestmark = pytest.mark.skipif(
    not os.path.exists(VECTOR_PATH),
    reason=(
        f"NIST KAT vector file not found at {VECTOR_PATH}. "
        "Download official ML-KEM-768 ACVP vectors before running this test; "
        "this is REQUIRED evidence for the final capstone report, not optional."
    ),
)


def load_kat_vectors():
    with open(VECTOR_PATH) as f:
        return json.load(f)


def test_keygen_matches_kat_vectors():
    """
    Uses the KAT-provided seed to deterministically regenerate a keypair
    (requires the underlying pqcrypto/liboqs binding to expose a
    seed-parameterized keygen — native FIPS 203 reference code does).
    """
    vectors = load_kat_vectors()
    from pqcrypto.kem import kyber768  # only meaningful with real native lib

    for i, vec in enumerate(vectors.get("keygen_cases", [])):
        seed = bytes.fromhex(vec["seed"])
        expected_pk = bytes.fromhex(vec["pk"])
        expected_sk = bytes.fromhex(vec["sk"])
        # NOTE: adapt this call to whatever deterministic keygen API your
        # chosen pqcrypto binding exposes (some require a wrapper).
        pk, sk = kyber768.generate_keypair_from_seed(seed)
        assert pk == expected_pk, f"KAT case {i}: public key mismatch"
        assert sk == expected_sk, f"KAT case {i}: secret key mismatch"


def test_encapsulation_matches_kat_vectors():
    vectors = load_kat_vectors()
    from pqcrypto.kem import kyber768

    for i, vec in enumerate(vectors.get("encaps_cases", [])):
        pk = bytes.fromhex(vec["pk"])
        randomness = bytes.fromhex(vec["randomness"])
        expected_ct = bytes.fromhex(vec["ct"])
        expected_ss = bytes.fromhex(vec["ss"])
        ct, ss = kyber768.encapsulate_with_randomness(pk, randomness)
        assert ct == expected_ct, f"KAT case {i}: ciphertext mismatch"
        assert ss == expected_ss, f"KAT case {i}: shared secret mismatch"


def test_decapsulation_matches_kat_vectors():
    vectors = load_kat_vectors()
    from pqcrypto.kem import kyber768

    for i, vec in enumerate(vectors.get("decaps_cases", [])):
        sk = bytes.fromhex(vec["sk"])
        ct = bytes.fromhex(vec["ct"])
        expected_ss = bytes.fromhex(vec["ss"])
        ss = kyber768.decapsulate(ct, sk)
        assert ss == expected_ss, f"KAT case {i}: shared secret mismatch"
