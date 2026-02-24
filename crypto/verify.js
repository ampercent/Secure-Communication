// crypto/verify.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const publicKeyPath = path.join(__dirname, '../keys/public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

/**
 * Verifies the RSA signature of a SHA-256 hash
 * @param {Buffer} hashBuffer - The recomputed hash of the decrypted file
 * @param {Buffer} signatureBuffer - The signature from the database
 * @returns {boolean} True if valid, false if tampered with
 */
function verifySignature(hashBuffer, signatureBuffer) {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(hashBuffer);

    // Returns a boolean indicating if the signature is valid
    return verify.verify(publicKey, signatureBuffer);
}

module.exports = { verifySignature };