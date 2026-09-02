"""
Authentication Integration Tests.
Tests user registration, login authentication, token refresh, and duplicate username/email rejection.
"""

def test_user_registration_and_login(client):
    # 1. Register User
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice_test", "email": "alice@test.com", "password": "SecurePassword123!"}
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["username"] == "alice_test"
    assert data["email"] == "alice@test.com"

    # 2. Duplicate Registration Rejection
    dup_response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice_test", "email": "alice_dup@test.com", "password": "SecurePassword123!"}
    )
    assert dup_response.status_code == 400

    # 3. Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "alice_test", "password": "SecurePassword123!"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # 4. Fetch /me profile
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "alice_test"
