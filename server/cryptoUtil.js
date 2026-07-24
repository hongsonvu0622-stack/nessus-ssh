const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.nexusssh');
const KEY_FILE = path.join(DATA_DIR, 'secret.key');

function getMasterKey() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(KEY_FILE)) {
    const key = crypto.randomBytes(32); // 256-bit key
    fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  }

  return fs.readFileSync(KEY_FILE);
}

function encryptPassword(plainText) {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith('ENC:v1:')) return plainText; // Already encrypted

  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `ENC:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Error encrypting password:', err);
    return plainText;
  }
}

function decryptPassword(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith('ENC:v1:')) return cipherText; // Plain text fallback

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return cipherText;

    const ivHex = parts[2];
    const authTagHex = parts[3];
    const encryptedHex = parts[4];

    const key = getMasterKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Error decrypting password:', err);
    return cipherText;
  }
}

// =====================================
// Cloud Sync E2EE Cryptography Utils
// =====================================

function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

function deriveKeyFromPassword(password, salt = 'nexus-sync-salt') {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encryptWithSymmetricKey(plainText, keyBuffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `ENC:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptWithSymmetricKey(cipherText, keyBuffer) {
  if (!cipherText || !cipherText.startsWith('ENC:v1:')) return cipherText;
  try {
    const parts = cipherText.split(':');
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encryptedHex = parts[4];
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Decryption failed: Invalid passphrase or corrupted data');
  }
}

function encryptWithPublicKey(plainText, publicKeyPem) {
  const buffer = Buffer.from(plainText, 'utf8');
  const encrypted = crypto.publicEncrypt(publicKeyPem, buffer);
  return encrypted.toString('base64');
}

function decryptWithPrivateKey(cipherTextBase64, privateKeyPem) {
  try {
    const buffer = Buffer.from(cipherTextBase64, 'base64');
    const decrypted = crypto.privateDecrypt(privateKeyPem, buffer);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Error decrypting with private key:', err);
    return null;
  }
}

module.exports = {
  encryptPassword,
  decryptPassword,
  generateRSAKeyPair,
  deriveKeyFromPassword,
  encryptWithSymmetricKey,
  decryptWithSymmetricKey,
  encryptWithPublicKey,
  decryptWithPrivateKey
};
