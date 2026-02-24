// crypto/sign.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load the private key generated earlier
const privateKeyPath = path.join(__dirname, '../keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

/**
 * Signs a SHA-256 hash using the RSA-3072 private key
 * @param {Buffer} hashBuffer - The raw SHA-256 hash of the plaintext file
 * @returns {Buffer} The cryptographic signature
 */
function signHash(hashBuffer) {
    // In Node.js, we create a Sign object, specify the algorithm, and feed it the data to sign.
    // We are signing the raw hash buffer.
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hashBuffer);
    sign.end();
    
    // We sign it using the private key we loaded from disk
    const signature = sign.sign(privateKey);
    return signature;
}

module.exports = { signHash };