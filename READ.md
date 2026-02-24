# 🛡️ Secure File Drop: Cryptography Proof-of-Concept

A secure file storage system built entirely with Node.js native libraries. This PoC demonstrates applied cryptography principles to guarantee **Confidentiality, Integrity, Authenticity, and Secure Key Management**.

## 🏗️ Architecture Diagram

```text
[User] 
  │ (Multipart File Upload)
  ▼
[Express Server + Multer MemoryStorage] -- (Plaintext file strictly in RAM)
  │
  ├─► 1. Hash: SHA-256(Plaintext)
  ├─► 2. Sign: RSA-Sign(Hash, PrivateKey)
  ├─► 3. Encrypt: AES-256-GCM(Plaintext) ─► Outputs: Ciphertext, IV, AuthTag, AES_Key
  ├─► 4. Wrap Key: RSA-OAEP(AES_Key, PublicKey)
  │
  ▼
[Storage & Database Routing]
  ├─► Save Ciphertext ───────────► [Local Disk: /storage]
  └─► Save Metadata & Wrapped Key ─► [SQLite DB: /db]