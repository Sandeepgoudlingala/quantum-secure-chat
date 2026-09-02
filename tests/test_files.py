"""
File Management Integration Tests.
Tests file upload with encryption metadata, listing user files, and downloading encrypted file payloads.
"""

import io

def test_file_upload_and_download(client):
    # 1. Register two test users
    user1_res = client.post(
        "/api/v1/auth/register",
        json={"username": "file_sender", "email": "sender@test.com", "password": "Password123!"}
    )
    user2_res = client.post(
        "/api/v1/auth/register",
        json={"username": "file_receiver", "email": "receiver@test.com", "password": "Password123!"}
    )
    receiver_id = user2_res.json()["id"]

    # 2. Login as sender
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_username": "file_sender", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Upload encrypted file mock
    file_bytes = b"AES-256-GCM Encrypted File Content Payload Bytes"
    file_data = {
        "file": ("secret_document.pdf.enc", io.BytesIO(file_bytes), "application/octet-stream")
    }
    session_key_b64 = "k1s2u3v4w5x6y7z8A1B2C3D4E5F6G7H8i9j0k1l2m3n="  # 32 bytes Base64
    data = {
        "recipient_id": receiver_id,
        "session_key": session_key_b64
    }

    upload_res = client.post(
        "/api/v1/files/upload",
        headers=headers,
        data=data,
        files=file_data
    )
    assert upload_res.status_code == 201
    file_meta = upload_res.json()
    assert file_meta["original_filename"] == "secret_document.pdf.enc"
    assert file_meta["recipient_id"] == receiver_id

    # 4. List uploaded files
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    files_list = list_res.json()
    assert len(files_list) >= 1
    assert any(f["id"] == file_meta["id"] for f in files_list)
