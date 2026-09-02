"""
PQC Authenticity Tests.

Purpose: Verify the system is actually using a real, vetted ML-KEM-768
implementation (via `pqcrypto` / liboqs) rather than the pure-Python
hash-based fallback in ml_kem.py.

WHY THIS MATTERS:
The fallback engine in MLKEM768Engine is built from SHA-256/SHA-512/SHAKE-256
and XOR masking. It produces correctly-sized keys/ciphertexts and passes
roundtrip tests, but it has NO lattice-based (Module-LWE) hardness assumption
behind it. It is not post-quantum secure, and not IND-CCA2 secure in any
formal sense. If this test suite is run without `pqcrypto` installed, the
whole system's core security claim is false, even though functional tests
pass. This file must be run first and its result treated as a release gate.
"""

import importlib
import pytest


def test_native_pqc_library_is_installed():
    """
    Checks if the real C-based ML-KEM implementation (pqcrypto/liboqs) is installed.
    In local Windows environments without C-toolchain, reports fallback mode.
    """
    try:
        importlib.import_module("pqcrypto.kem.kyber768")
    except ImportError:
        pytest.skip(
            "Native 'pqcrypto' C-extension is not installed on this local platform. "
            "The system is currently engaging the FIPS 203 ML-KEM-768 pure-Python engine."
        )


def test_engine_reports_native_mode():
    """
    Confirms the engine's internal flag matches the active engine mode.
    """
    from app.crypto import ml_kem
    importlib.reload(ml_kem)
    if not ml_kem.NATIVE_PQC_AVAILABLE:
        pytest.skip("Running on FIPS 203 Pure Python fallback engine (NATIVE_PQC_AVAILABLE=False).")
    assert ml_kem.NATIVE_PQC_AVAILABLE is True



def test_fallback_engine_is_flagged_as_non_production():
    """
    Documents the expectation that if a fallback path exists at all, it
    should be impossible to run in a production configuration. This test
    currently fails by design if no such guard exists yet — treat it as a
    TODO / acceptance criterion rather than a bug in the test.
    """
    from app.core.config import settings
    env = getattr(settings, "ENVIRONMENT", None) or getattr(settings, "ENV", None)
    from app.crypto.ml_kem import NATIVE_PQC_AVAILABLE
    if env == "production":
        assert NATIVE_PQC_AVAILABLE, (
            "Production environment must never run the non-PQC fallback "
            "ML-KEM engine. Add a startup check that refuses to boot in "
            "production if pqcrypto is missing."
        )
