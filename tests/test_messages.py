"""
Tests for Encrypted Messaging and Conversation Deletion.
"""

import pytest
from app.services.chat_service import ChatService
from app.models.user import User
from app.core.security import hash_password


@pytest.fixture
def test_users(db):
    user1 = User(
        username="alice",
        email="alice@example.com",
        hashed_password=hash_password("password123")
    )
    user2 = User(
        username="bob",
        email="bob@example.com",
        hashed_password=hash_password("password123")
    )

    db.add(user1)
    db.add(user2)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    return user1, user2


def test_chat_service_save_and_delete_conversation(db, test_users):
    user1, user2 = test_users

    # Save messages
    msg1 = ChatService.save_encrypted_message(
        db=db,
        sender_id=user1.id,
        receiver_id=user2.id,
        encrypted_content="enc_payload_1",
        iv="iv1",
        auth_tag="tag1"
    )
    msg2 = ChatService.save_encrypted_message(
        db=db,
        sender_id=user2.id,
        receiver_id=user1.id,
        encrypted_content="enc_payload_2",
        iv="iv2",
        auth_tag="tag2"
    )

    history = ChatService.get_conversation_history(db=db, user1_id=user1.id, user2_id=user2.id)
    assert len(history) == 2

    # Delete conversation history
    deleted_count = ChatService.delete_conversation_history(db=db, user1_id=user1.id, user2_id=user2.id)
    assert deleted_count == 2

    history_after = ChatService.get_conversation_history(db=db, user1_id=user1.id, user2_id=user2.id)
    assert len(history_after) == 0


def test_delete_conversation_endpoint(client, db, test_users):
    user1, user2 = test_users

    # Authenticate user1
    auth_resp = client.post("/api/v1/auth/login", json={"email_or_username": "alice", "password": "password123"})
    assert auth_resp.status_code == 200, f"Login failed: {auth_resp.text}"
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}


    # Save a message
    ChatService.save_encrypted_message(
        db=db,
        sender_id=user1.id,
        receiver_id=user2.id,
        encrypted_content="enc_payload_1",
        iv="iv1",
        auth_tag="tag1"
    )

    # Get conversation history via API
    get_resp = client.get(f"/api/v1/messages/conversation/{user2.id}", headers=headers)
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    # Call DELETE conversation endpoint
    del_resp = client.delete(f"/api/v1/messages/conversation/{user2.id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["deleted_count"] == 1

    # Verify conversation history is empty now
    get_resp_after = client.get(f"/api/v1/messages/conversation/{user2.id}", headers=headers)
    assert get_resp_after.status_code == 200
    assert len(get_resp_after.json()) == 0
