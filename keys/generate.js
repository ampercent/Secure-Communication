// keys/generate.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Generating RSA-3072 keypair... This might take a few seconds.');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 3072, // Enterprise standard
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

fs.writeFileSync(path.join(__dirname, 'public.pem'), publicKey);
fs.writeFileSync(path.join(__dirname, 'private.pem'), privateKey);

console.log('Success! Keys saved to the /keys directory.');