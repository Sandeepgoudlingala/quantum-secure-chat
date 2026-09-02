# Hybrid Post-Quantum Cryptographic Communication System (ML-KEM-768 + AES-256-GCM)

A production-grade, end-to-end encrypted secure communication platform implementing **NIST FIPS 203 ML-KEM-768 (Kyber-768)** post-quantum key encapsulation mechanism and **AES-256-GCM** symmetric encryption for real-time chat, secure file sharing, and audit trail compliance.

---

## 🌟 Key Features

- **Post-Quantum Key Exchange**: NIST FIPS 203 ML-KEM-768 lattice-based key encapsulation mechanism.
- **Symmetric Cipher**: FIPS 197 AES-256-GCM encryption with 96-bit IVs and 128-bit authentication tags.
- **Key Derivation**: HKDF-SHA256 for deriving symmetric session keys from ML-KEM shared secrets.
- **Real-Time Encrypted Chat**: WebSockets real-time messaging, online user presence, typing indicators, delivery receipts, and ciphertext inspection.
- **Secure File Vault**: Pre-upload AES-256-GCM file encryption, SHA-256 data integrity verification, and secure stream downloads.
- **Security & OWASP Compliance**: Rate limiting, bcrypt password hashing, JWT authentication, security headers, and zero-plaintext storage.
- **Audit Logging**: Immutable security event logging (`LOGIN`, `LOGOUT`, `KEY_EXCHANGE`, `MESSAGE_SENT`, `FILE_UPLOADED`, `FILE_DOWNLOADED`).
- **Container Deployment**: Docker Compose orchestration for MySQL 8.0, FastAPI backend, and Nginx frontend.

---

## 🏗 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, WebSockets |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic v2, bcrypt, SlowAPI |
| **Cryptography** | ML-KEM-768 (Kyber-768), AES-256-GCM, HKDF-SHA256, SHA-256 |
| **Database** | MySQL 8.0 (Production) / SQLite (Local Dev Fallback) |
| **Deployment** | Docker, Docker Compose, Nginx Reverse Proxy |

---

## 🚀 Quick Start Guide

### Option A: Local Development (Fastest)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: `http://localhost:5173`

---

### Option B: Production Docker Deployment

```bash
# Build and launch all container services
docker-compose up --build -d
```
- Frontend Application: `http://localhost:80`
- REST API Base: `http://localhost/api/v1`
- MySQL Container: `localhost:3306`

---

## 🧪 Running Automated Test Suite

```bash
cd backend
pytest ../tests/ -v
```

---

## 📁 Repository Directory Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Auth, Users, Crypto, Messages, Files, Audit REST routes
│   │   ├── core/               # Config, Database, Security, Rate Limiter, Logging
│   │   ├── crypto/             # ML-KEM-768, AES-256-GCM, HKDF Key Derivation
│   │   ├── models/             # SQLAlchemy ORM Data Models (User, Message, File, SessionKey, AuditLog)
│   │   ├── schemas/            # Pydantic Request/Response DTOs
│   │   ├── services/           # Clean Architecture Business Logic Services
│   │   └── main.py             # FastAPI App Entrypoint
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar
│   │   ├── context/            # AuthContext, CryptoContext, SocketContext
│   │   ├── pages/              # Login, Register, Dashboard, ChatPage, FilePage, AuditLogsPage
│   │   └── services/           # Axios API Client & Web Crypto Helpers
│   └── Dockerfile
├── docker/
│   ├── nginx/nginx.conf
│   └── mysql/init.sql
├── docs/                       # Architecture, API Spec & Security Audit Reports
├── tests/                      # Pytest Cryptographic & Integration Suite
└── docker-compose.yml
```
