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
    return '';
  }
}

module.exports = {
  encryptPassword,
  decryptPassword
};
