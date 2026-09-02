# REST & WebSocket API Specification

## Base URL
- **HTTP**: `http://localhost:8000/api/v1`
- **WebSocket**: `ws://localhost:8000/ws/chat?token={JWT_TOKEN}`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Registers a new user account.
- **Request Body**:
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "uuid-v4-string",
    "username": "alice",
    "email": "alice@example.com",
    "public_key": null,
    "is_active": true,
    "is_online": false,
    "created_at": "2026-07-26T00:00:00Z"
  }
  ```

### `POST /auth/login`
Authenticates credentials and returns JWT tokens.
- **Request Body**:
  ```json
  {
    "email_or_username": "alice",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "token_type": "bearer",
    "expires_in": 900
  }
  ```

---

## 2. Post-Quantum Cryptography Endpoints

### `POST /crypto/generate-keypair`
Generates a new ML-KEM-768 keypair.
- **Header**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "public_key": "Base64-1184-bytes",
    "secret_key": "Base64-2400-bytes",
    "parameter_set": "ML-KEM-768"
  }
  ```

### `POST /crypto/encapsulate`
Encapsulates shared secret using recipient's public key.
- **Request Body**:
  ```json
  {
    "recipient_id": "target-uuid",
    "recipient_public_key": "Base64-1184-bytes"
  }
  ```
- **Response**:
  ```json
  {
    "kem_ciphertext": "Base64-1088-bytes",
    "shared_secret": "Base64-32-bytes"
  }
  ```

---

## 3. Real-Time WebSocket Events

### Connection: `ws://localhost:8000/ws/chat?token=<JWT>`

- **Send Message Event**:
  ```json
  {
    "event_type": "SEND_MESSAGE",
    "payload": {
      "receiver_id": "target-uuid",
      "encrypted_content": "Base64-AES-Ciphertext",
      "iv": "Base64-12-bytes",
      "auth_tag": "Base64-16-bytes"
    }
  }
  ```
- **Typing Indicator**:
  ```json
  {
    "event_type": "TYPING_START",
    "payload": { "recipient_id": "target-uuid" }
  }
  ```
