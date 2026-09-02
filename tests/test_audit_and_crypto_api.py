"""
Integration tests for Cryptographic REST APIs, Audit Logs, and System Health.
"""

import pytest


def test_system_health_and_root(client):
    # 1. Test Root
    root_resp = client.get("/")
    assert root_resp.status_code == 200
    root_data = root_resp.json()
    assert root_data["status"] == "online"
    assert root_data["quantum_algorithm"] == "ML-KEM-768"
    assert root_data["symmetric_algorithm"] == "AES-256-GCM"

    # 2. Test Health
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"


def test_crypto_api_endpoints_roundtrip(client):
    # Register and login a test user
    client.post(
        "/api/v1/auth/register",
        json={"username": "crypto_user", "email": "crypto@test.com", "password": "Password123!"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "crypto_user", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Generate ML-KEM Keypair
    kp_res = client.post("/api/v1/crypto/generate-keypair", headers=headers)
    assert kp_res.status_code == 200
    kp_data = kp_res.json()
    assert "public_key" in kp_data
    assert "secret_key" in kp_data
    assert kp_data["parameter_set"] == "ML-KEM-768"

    pk = kp_data["public_key"]
    sk = kp_data["secret_key"]

    # 2. Encapsulate
    encap_res = client.post(
        "/api/v1/crypto/encapsulate",
        headers=headers,
        json={"recipient_id": "dummy-uuid", "recipient_public_key": pk}
    )
    assert encap_res.status_code == 200
    encap_data = encap_res.json()
    kem_ct = encap_data["kem_ciphertext"]
    sender_shared_secret = encap_data["shared_secret"]

    # 3. Decapsulate
    decap_res = client.post(
        "/api/v1/crypto/decapsulate",
        headers=headers,
        json={"kem_ciphertext": kem_ct, "secret_key": sk}
    )
    assert decap_res.status_code == 200
    receiver_shared_secret = decap_res.json()["shared_secret"]

    # 4. Verify shared secrets match
    assert sender_shared_secret == receiver_shared_secret

    # 5. Encrypt with derived session key
    enc_res = client.post(
        "/api/v1/crypto/encrypt",
        headers=headers,
        json={"plaintext": "Secret Quantum Message", "session_key": sender_shared_secret}
    )
    assert enc_res.status_code == 200
    enc_data = enc_res.json()

    # 6. Decrypt with derived session key
    dec_res = client.post(
        "/api/v1/crypto/decrypt",
        headers=headers,
        json={
            "ciphertext": enc_data["ciphertext"],
            "session_key": receiver_shared_secret,
            "iv": enc_data["iv"],
            "auth_tag": enc_data["auth_tag"]
        }
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["plaintext"] == "Secret Quantum Message"
    assert dec_res.json()["integrity_verified"] is True


def test_audit_logs_endpoint(client):
    # Register and login to generate audit logs
    client.post(
        "/api/v1/auth/register",
        json={"username": "audit_user", "email": "audit@test.com", "password": "Password123!"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "audit_user", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query audit logs
    logs_res = client.get("/api/v1/audit-logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert any(log["event_type"] == "LOGIN_SUCCESS" for log in logs)

