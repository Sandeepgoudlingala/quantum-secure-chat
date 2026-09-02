# Hybrid Post-Quantum Cryptographic System Architecture

## Architectural Vision & Principles

This system implements a production-grade **Hybrid Cryptographic Communication System** designed to withstand both classical threats and quantum computer cryptanalysis (Shor's and Grover's algorithms).

### Cryptographic Standards Compliance
1. **Key Encapsulation Mechanism (KEM)**: **NIST FIPS 203 ML-KEM-768 (Kyber-768)**
   - Matrix Dimension: $k = 3$
   - Public Key Size: 1184 bytes
   - Secret Key Size: 2400 bytes
   - Ciphertext Size: 1088 bytes
   - Target Security Category: NIST Level 3 (Equivalent to AES-192 strength against quantum attack)
2. **Symmetric Encryption**: **NIST FIPS 197 AES-256-GCM**
   - Key Size: 256 bits (32 bytes) derived via **HKDF-SHA256**
   - Nonce / IV: 96 bits (12 bytes) cryptographically secure random bytes
   - Tag: 128 bits (16 bytes) authentication tag for payload integrity
3. **Data Integrity Verification**: **SHA-256 Hash Digesting**

---

## High-Level System Layers

```
                               ┌────────────────────────────────┐
                               │   React 18 + Vite Frontend     │
                               │ (Tailwind CSS, Glassmorphism)  │
                               └───────────────┬────────────────┘
                                               │ HTTP / WebSockets
                               ┌───────────────▼────────────────┐
                               │       Nginx Reverse Proxy      │
                               └───────────────┬────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │ REST API (/api/v1)       WebSockets (/ws)   │
                        └──────────────────────┬──────────────────────┘
                                               │
                               ┌───────────────▼────────────────┐
                               │     FastAPI Core Backend       │
                               │  (Python 3.12, Clean Arch)    │
                               └───────────────┬────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │                                 │                                 │
┌────────────▼───────────┐         ┌───────────▼───────────┐         ┌───────────▼───────────┐
│ ML-KEM-768 PQC Engine  │         │  AES-256-GCM Engine   │         │ MySQL / SQLite DB     │
│ (FIPS 203 Kyber KEM)   │         │  (HKDF Key Derivation)│         │ (Zero-Plaintext Store)│
└────────────────────────┘         └───────────────────────┘         └───────────────────────┘
```

---

## E2EE Hybrid Handshake Sequence

1. **User B (Recipient)** registers their ML-KEM-768 Public Key $pk_B$ with the public directory.
2. **User A (Sender)** fetches $pk_B$ from the server directory.
3. **User A** executes `Encapsulate(pk_B)` to produce:
   - Encapsulated Ciphertext $C_{kem}$
   - Shared Secret $K_{raw}$
4. **User A** derives an AES-256 Session Key $K_{aes} = \text{HKDF-SHA256}(K_{raw})$.
5. **User A** transmits $C_{kem}$ to User B via WebSockets or REST handshake API.
6. **User B** executes `Decapsulate(C_{kem}, sk_B)` using their secret key $sk_B$ to recover $K_{raw}$.
7. **User B** derives the identical AES-256 Session Key $K_{aes} = \text{HKDF-SHA256}(K_{raw})$.
8. All subsequent chat messages and uploaded files are symmetrically encrypted using AES-256-GCM with $K_{aes}$. Zero plain text is stored on the server database or file system.
