// src/server.js
// Add these to the top of src/server.js
// Add these to the top of src/server.js
const { unwrapKey } = require('../crypto/unwrapKey');
const { decryptFile } = require('../crypto/decrypt');
const { verifySignature } = require('../crypto/verify');
const { randomUUID } = require('crypto');
const { encryptFile } = require('../crypto/encrypt');
const { hashFile } = require('../crypto/hash');
const { signHash } = require('../crypto/sign');
const { wrapKey } = require('../crypto/wrapKey');
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
// Serve static files (like our index.html) from the public directory
app.use(express.static(path.join(__dirname, '../public')));
const PORT = process.env.PORT || 3000;

// Security Control: Use memoryStorage to prevent plaintext files from touching the disk
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit enforcement
    }
});

// Initialize SQLite Database
const db = require('../db/db');

// Endpoint: Upload Flow Placeholder
// Replace the existing upload placeholder in src/server.js with this:

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const fileBuffer = req.file.buffer;
        const originalName = req.file.originalname;
        const fileId = randomUUID();

        console.log(`Processing upload for: ${originalName}`);

        // 1. Hash the original plaintext file
        const fileHash = hashFile(fileBuffer);

        // 2. Sign the hash with our RSA Private Key
        const signature = signHash(fileHash);

        // 3. Encrypt the file using AES-256-GCM
        const { aesKey, iv, ciphertext, authTag } = encryptFile(fileBuffer);

        // 4. Wrap (encrypt) the AES key with our RSA Public Key
        const wrappedKey = wrapKey(aesKey);

        // 5. Save the encrypted file to the /storage directory
        const storagePath = path.join(__dirname, '../storage', fileId);
        fs.writeFileSync(storagePath, ciphertext);

        // 6. Save the cryptographic metadata to SQLite
        // We MUST convert raw buffers to hex or base64 strings for safe database storage
        const stmt = db.prepare(`
            INSERT INTO file_metadata 
            (id, original_filename, iv, authTag, hash, signature, wrapped_aes_key) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            fileId,
            originalName,
            iv.toString('hex'),
            authTag.toString('hex'),
            fileHash.toString('hex'),
            signature.toString('base64'),
            wrappedKey.toString('base64'),
            function (err) {
                if (err) {
                    console.error('Database insertion error:', err);
                    return res.status(500).json({ error: 'Failed to save metadata.' });
                }

                // Success! Return the ID to the user.
                res.json({
                    message: 'File securely encrypted and stored.',
                    fileId: fileId
                });
            }
        );
        stmt.finalize();

    } catch (error) {
        console.error('Encryption pipeline error:', error);
        res.status(500).json({ error: 'Internal server error during encryption.' });
    }
});

// Endpoint: Download Flow Placeholder
// Replace the existing GET /file/:id endpoint in src/server.js
// Security Audit Logger
function logVerification(fileId, status, details) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] EVENT: ${status} | FILE_ID: ${fileId} | DETAILS: ${details}\n`;

    // Append to a log file in the project root
    fs.appendFileSync(path.join(__dirname, '../verification.log'), logEntry);
    console.log(logEntry.trim());
}

app.get('/file/:id', (req, res) => {
    const fileId = req.params.id;

    // 1. Fetch metadata from SQLite
    db.get(`SELECT * FROM file_metadata WHERE id = ?`, [fileId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'File not found or invalid ID.' });
        }

        try {
            // 2. Read the encrypted ciphertext from disk
            const storagePath = path.join(__dirname, '../storage', fileId);
            if (!fs.existsSync(storagePath)) {
                return res.status(404).json({ error: 'Encrypted file missing from storage.' });
            }
            const ciphertext = fs.readFileSync(storagePath);

            // 3. Convert database strings back into raw Buffers
            const ivBuffer = Buffer.from(row.iv, 'hex');
            const authTagBuffer = Buffer.from(row.authTag, 'hex');
            const signatureBuffer = Buffer.from(row.signature, 'base64');
            const wrappedKeyBuffer = Buffer.from(row.wrapped_aes_key, 'base64');

            // 4. Unwrap the AES key using the RSA Private Key
            const aesKey = unwrapKey(wrappedKeyBuffer);

            // 5. Decrypt the file & verify GCM Auth Tag (Integrity Check)
            // If the ciphertext or auth tag was altered, this function will throw an error!
            const plaintextBuffer = decryptFile(ciphertext, aesKey, ivBuffer, authTagBuffer);

            // 6. Re-hash the decrypted file
            const newHash = hashFile(plaintextBuffer);

            // 7. Verify the RSA Digital Signature (Authenticity Check)
            const isValid = verifySignature(newHash, signatureBuffer);

            if (!isValid) {
                // This means the file decrypted, but the signature doesn't match the original.
                // It indicates a severe security compromise (e.g., someone replaced the file and updated the database, but didn't have our private key to sign it).
                console.error(`SECURITY ALERT: Signature verification failed for file ${fileId}`);
                return res.status(403).json({ error: 'Integrity check failed: Invalid signature.' });
            }

            console.log(`File ${fileId} successfully verified and decrypted.`);

            // 8. Stream the file back to the user
            res.setHeader('Content-Disposition', `attachment; filename="${row.original_filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(plaintextBuffer);

        } catch (error) {
            console.error('Decryption pipeline error:', error.message);
            // We return a generic error to the user so we don't leak cryptographic failure details
            res.status(400).json({ error: 'Decryption failed or file was tampered with.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Secure File Drop running on http://localhost:${PORT}`);
});