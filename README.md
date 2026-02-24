# 🛡️ Secure File Drop

A secure file storage proof-of-concept built entirely with **Node.js native libraries**. It demonstrates applied cryptography to guarantee **Confidentiality**, **Integrity**, **Authenticity**, and **Secure Key Management** — with no third-party crypto dependencies.

---

## ✨ Features

| Property | Mechanism |
|---|---|
| **Confidentiality** | AES-256-GCM symmetric encryption |
| **Key Security** | AES key wrapped with RSA-OAEP (3072-bit) |
| **Integrity** | AES-GCM Authentication Tag + SHA-256 hash |
| **Authenticity** | RSA-PSS digital signature over the file hash |
| **Zero plaintext on disk** | Multer `memoryStorage` — file bytes live only in RAM |

---

## 🏗️ Architecture

```text
[User]
  │ (Multipart File Upload)
  ▼
[Express Server + Multer MemoryStorage] -- (Plaintext file strictly in RAM)
  │
  ├─► 1. Hash:       SHA-256(Plaintext)
  ├─► 2. Sign:       RSA-PSS-Sign(Hash, PrivateKey)
  ├─► 3. Encrypt:    AES-256-GCM(Plaintext) ─► Ciphertext + IV + AuthTag + AES_Key
  ├─► 4. Wrap Key:   RSA-OAEP(AES_Key, PublicKey)
  │
  ▼
[Storage & Database Routing]
  ├─► Ciphertext ─────────────────► /storage/<uuid>   (disk)
  └─► IV, AuthTag, Hash, Signature, WrappedKey ─► /db/database.sqlite

[Download Request]
  │
  ├─► 1. Fetch metadata from SQLite
  ├─► 2. Read ciphertext from disk
  ├─► 3. Unwrap AES key with RSA Private Key
  ├─► 4. Decrypt with AES-256-GCM (AuthTag verified automatically)
  ├─► 5. Re-hash decrypted plaintext
  ├─► 6. Verify RSA digital signature
  └─► 7. Stream plaintext back to user
```

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)
- **OR** [Docker](https://www.docker.com/) (no local Node.js required)

---

## 🚀 Getting Started

### Option A — Run locally

```bash
# 1. Clone the repository
git clone https://github.com/ampercent/Secure-Communication.git
cd Secure-Communication

# 2. Install dependencies
npm install

# 3. Generate the RSA-3072 key pair (only needed once)
node keys/generate.js

# 4. Start the server
node src/server.js
```

Open your browser at **http://localhost:3000**.

### Option B — Run with Docker

```bash
# Build the image
docker build -t secure-file-drop .

# Run the container
# The CMD in the Dockerfile automatically generates keys and starts the server
docker run -p 3000:3000 secure-file-drop
```

Open your browser at **http://localhost:3000**.

> **Tip:** To persist uploaded files across container restarts, mount volumes:
> ```bash
> docker run -p 3000:3000 \
>   -v $(pwd)/storage:/usr/src/app/storage \
>   -v $(pwd)/db:/usr/src/app/db \
>   -v $(pwd)/keys:/usr/src/app/keys \
>   secure-file-drop
> ```

---

## 🖥️ Usage

1. **Upload** — Select any file (up to 10 MB) and click **Encrypt & Upload**. The server returns a UUID `fileId`.
2. **Retrieve** — Enter the `fileId` in the download form and click **Verify & Download**. The server decrypts the file, verifies its signature, and streams it back to your browser.

---

## 🌐 API Reference

### `POST /upload`

Encrypts and stores a file.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | The file to encrypt (max 10 MB) |

**Response `200 OK`**

```json
{
  "message": "File securely encrypted and stored.",
  "fileId": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### `GET /file/:id`

Decrypts, verifies, and downloads a file.

| Parameter | Description |
|---|---|
| `id` | The UUID returned by `POST /upload` |

**Response `200 OK`** — The original file as a binary download (`application/octet-stream`).

**Error responses**

| Status | Meaning |
|---|---|
| `400` | Decryption failed or file was tampered with |
| `403` | Signature verification failed (authenticity breach) |
| `404` | File ID not found |
| `500` | Internal server error |

---

## 📁 Project Structure

```
Secure-Communication/
├── crypto/
│   ├── encrypt.js      # AES-256-GCM encryption
│   ├── decrypt.js      # AES-256-GCM decryption + AuthTag verification
│   ├── hash.js         # SHA-256 hashing
│   ├── sign.js         # RSA-PSS signing
│   ├── verify.js       # RSA-PSS signature verification
│   ├── wrapKey.js      # RSA-OAEP key wrapping
│   └── unwrapKey.js    # RSA-OAEP key unwrapping
├── db/
│   ├── db.js           # SQLite connection & schema initialization
│   └── schema.sql      # file_metadata table definition
├── keys/
│   └── generate.js     # RSA-3072 key pair generator
├── public/
│   └── index.html      # Web UI
├── src/
│   └── server.js       # Express application & route handlers
├── storage/            # Encrypted ciphertext files (git-ignored)
├── Dockerfile
└── package.json
```

---

## 🔒 Security Notes

- **Private key (`keys/private.pem`)** is stored on disk and must be kept secret. In a production system, use a Hardware Security Module (HSM) or a secrets manager (e.g., AWS KMS, HashiCorp Vault).
- **Plaintext never touches disk** — Multer `memoryStorage` keeps uploaded bytes exclusively in RAM during processing.
- **Tamper detection** — AES-GCM authentication tags and the RSA digital signature independently detect any modification to the ciphertext or metadata.
- **Audit log** — Every download attempt (success or failure) is appended to `verification.log` in the project root.
- **File size limit** — Uploads are capped at 10 MB by the Multer configuration.
