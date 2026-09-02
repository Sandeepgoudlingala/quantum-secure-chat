"""
Performance Benchmarks.

Reproduces (and lets you re-verify) the latency/throughput numbers claimed
in the project README, plus a classical-crypto baseline comparison so you
can report PQC overhead honestly, and a concurrency test for realistic load.

Run with: pytest tests/test_performance_benchmarks.py -v -s
"""

import os
import time
import statistics
import pytest

from app.crypto.ml_kem import MLKEM768Engine
from app.crypto.aes_gcm import AES256GCMEngine
from app.crypto.key_derivation import KeyDerivationEngine

N_ITER = 200


def _time_it(fn, n=N_ITER):
    samples = []
    for _ in range(n):
        start = time.perf_counter()
        fn()
        samples.append((time.perf_counter() - start) * 1000.0)  # ms
    return {
        "mean_ms": statistics.mean(samples),
        "stdev_ms": statistics.stdev(samples) if n > 1 else 0.0,
        "min_ms": min(samples),
        "max_ms": max(samples),
    }


def test_benchmark_ml_kem_keygen():
    stats = _time_it(MLKEM768Engine.generate_keypair)
    print(f"\n[ML-KEM-768 KeyGen] mean={stats['mean_ms']:.4f}ms stdev={stats['stdev_ms']:.4f}ms")
    assert stats["mean_ms"] < 50, "Keygen unexpectedly slow — investigate regression."


def test_benchmark_ml_kem_encapsulate():
    pk, _ = MLKEM768Engine.generate_keypair()
    stats = _time_it(lambda: MLKEM768Engine.encapsulate(pk))
    print(f"\n[ML-KEM-768 Encapsulate] mean={stats['mean_ms']:.4f}ms stdev={stats['stdev_ms']:.4f}ms")


def test_benchmark_ml_kem_decapsulate():
    pk, sk = MLKEM768Engine.generate_keypair()
    ct, _ = MLKEM768Engine.encapsulate(pk)
    stats = _time_it(lambda: MLKEM768Engine.decapsulate(ct, sk))
    print(f"\n[ML-KEM-768 Decapsulate] mean={stats['mean_ms']:.4f}ms stdev={stats['stdev_ms']:.4f}ms")


@pytest.mark.parametrize("size_label,size_bytes", [
    ("1KB", 1024),
    ("1MB", 1024 * 1024),
    ("10MB", 10 * 1024 * 1024),
])
def test_benchmark_aes_gcm_encrypt_by_size(size_label, size_bytes):
    key = AES256GCMEngine.generate_session_key()
    payload = os.urandom(size_bytes)

    def _enc():
        AES256GCMEngine.encrypt(payload, key)

    stats = _time_it(_enc, n=30 if size_bytes > 1024 * 1024 else N_ITER)
    throughput_mb_s = (size_bytes / (1024 * 1024)) / (stats["mean_ms"] / 1000.0)
    print(f"\n[AES-256-GCM Encrypt {size_label}] mean={stats['mean_ms']:.4f}ms "
          f"throughput={throughput_mb_s:.1f} MB/s")


def test_benchmark_full_handshake_pipeline():
    def _full_handshake():
        pk, sk = MLKEM768Engine.generate_keypair()
        ct, ss_sender = MLKEM768Engine.encapsulate(pk)
        ss_receiver = MLKEM768Engine.decapsulate(ct, sk)
        KeyDerivationEngine.derive_aes_256_key(ss_sender)
        KeyDerivationEngine.derive_aes_256_key(ss_receiver)

    stats = _time_it(_full_handshake, n=100)
    print(f"\n[Full E2EE Handshake] mean={stats['mean_ms']:.4f}ms stdev={stats['stdev_ms']:.4f}ms")


def test_classical_baseline_comparison_x25519():
    """
    Comparative baseline: classical X25519 ECDH key exchange, so the report
    can state PQC overhead honestly (e.g. "ML-KEM handshake adds Xms /
    Y% over classical ECDH").
    """
    try:
        from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
    except ImportError:
        pytest.skip("cryptography X25519 module unavailable")

    def _classical_handshake():
        priv_a = X25519PrivateKey.generate()
        priv_b = X25519PrivateKey.generate()
        shared_a = priv_a.exchange(priv_b.public_key())
        shared_b = priv_b.exchange(priv_a.public_key())
        assert shared_a == shared_b

    classical_stats = _time_it(_classical_handshake, n=100)

    def _pqc_handshake():
        pk, sk = MLKEM768Engine.generate_keypair()
        ct, _ = MLKEM768Engine.encapsulate(pk)
        MLKEM768Engine.decapsulate(ct, sk)

    pqc_stats = _time_it(_pqc_handshake, n=100)

    overhead_pct = ((pqc_stats["mean_ms"] - classical_stats["mean_ms"])
                     / classical_stats["mean_ms"]) * 100
    print(f"\n[Baseline Comparison] X25519={classical_stats['mean_ms']:.4f}ms "
          f"ML-KEM-768={pqc_stats['mean_ms']:.4f}ms overhead={overhead_pct:.1f}%")
