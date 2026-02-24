// crypto/decrypt.js
const crypto = require('crypto');

/**
 * Decrypts ciphertext using AES-256-GCM and verifies integrity
 * @param {Buffer} ciphertext - The encrypted file data
 * @param {Buffer} aesKey - The unwrapped 32-byte AES key
 * @param {Buffer} iv - The 12-byte Initialization Vector
 * @param {Buffer} authTag - The 16-byte Authentication Tag
 * @returns {Buffer} The original plaintext file
 */
function decryptFile(ciphertext, aesKey, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);

    // We MUST set the auth tag before calling final()
    decipher.setAuthTag(authTag);

    // Decrypt the file
    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final() // <--- This will THROW AN ERROR if the file was tampered with!
    ]);

    return plaintext;
}

module.exports = { decryptFile };