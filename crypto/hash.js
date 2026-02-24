// crypto/hash.js
const crypto = require('crypto');

/**
 * Computes the SHA-256 hash of a file buffer
 * @param {Buffer} fileBuffer - The plaintext file
 * @returns {Buffer} The raw hash buffer
 */
function hashFile(fileBuffer) {
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest(); // Returns a raw Buffer
}

module.exports = { hashFile };