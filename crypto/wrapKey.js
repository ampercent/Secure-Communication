// crypto/wrapKey.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load the public key to wrap (encrypt) the AES key
const publicKeyPath = path.join(__dirname, '../keys/public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

/**
 * Encrypts an AES key using the RSA public key (RSA-OAEP)
 * @param {Buffer} aesKeyBuffer - The raw 32-byte AES key
 * @returns {Buffer} The encrypted (wrapped) AES key
 */
function wrapKey(aesKeyBuffer) {
    // Node's crypto.publicEncrypt requires the key and the buffer to encrypt.
    // We explicitly specify the padding scheme (OAEP) and the hash algorithm used for the padding.
    const wrappedKey = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, aesKeyBuffer);
    
    return wrappedKey;
}

module.exports = { wrapKey };