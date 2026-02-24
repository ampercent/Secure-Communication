// crypto/unwrapKey.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const privateKeyPath = path.join(__dirname, '../keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

/**
 * Decrypts the wrapped AES key using the RSA private key (RSA-OAEP)
 * @param {Buffer} wrappedKeyBuffer - The encrypted AES key
 * @returns {Buffer} The raw 32-byte AES key
 */
function unwrapKey(wrappedKeyBuffer) {
    // Must use the exact same padding and hash as the wrapping function
    const aesKey = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, wrappedKeyBuffer);

    return aesKey;
}

module.exports = { unwrapKey };