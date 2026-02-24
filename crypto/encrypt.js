// crypto/encrypt.js
const crypto = require('crypto');

/**
 * Encrypts a file buffer using AES-256-GCM
 * @param {Buffer} fileBuffer - The plaintext file in memory
 * @returns {Object} Contains the raw buffers for the key, IV, ciphertext, and auth tag
 */
function encryptFile(fileBuffer) {
    // 1. Generate a 256-bit (32-byte) random AES key
    const aesKey = crypto.randomBytes(32);
    
    // 2. Generate a 96-bit (12-byte) Initialization Vector (IV)
    // NIST recommends exactly 12 bytes for GCM mode for optimal performance and security.
    const iv = crypto.randomBytes(12);

    // 3. Initialize the cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);

    // 4. Encrypt the file buffer
    const ciphertext = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);

    // 5. Extract the Authentication Tag (16 bytes)
    const authTag = cipher.getAuthTag();

    // We return these as raw buffers so the pipeline can decide how to encode them (e.g., base64)
    return {
        aesKey,
        iv,
        ciphertext,
        authTag
    };
}

module.exports = { encryptFile };