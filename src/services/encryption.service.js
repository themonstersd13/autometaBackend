import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const USER_KEY = process.env.ENCRYPTION_KEY;

// --- THIS IS THE FIX ---
// It allows any string in the .env file.
if (!USER_KEY) {
  throw new Error(
    `ENCRYPTION_KEY is not set in the .env file. Please add it.`
  );
}

// 1. Create a 32-byte key (256 bits) from the user-provided key using sha256.
// This is the correct, secure way to handle a user-provided passphrase
// of any length for a 32-byte encryption algorithm.
// It ensures any string you provide becomes a valid 32-byte key.
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(String(USER_KEY))
  .digest('base64') // Get a base64 string from the hash
  .slice(0, 32); // And take the first 32 characters as our key

// ----------------------------------------------------

const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts text using aes-256-cbc
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in 'iv:encryptedData' hex format
 */
export const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'utf-8'), // Use 'utf-8' for the key
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend the IV to the encrypted text (common practice)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed: ' + error.message);
  }
};

/**
 * Decrypts text encrypted with aes-256-cbc
 * @param {string} text - The text to decrypt (in 'iv:encryptedData' hex format)
 * @returns {string} - The decrypted text
 */
export const decrypt = (text) => {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format.');
    }
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'utf-8'), // Use 'utf-8' for the key
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    if (error.code === 'ERR_CRYPTO_INVALID_KEYLEN') {
      throw new Error(
        'Decryption failed: Could not create valid 32-byte key.'
      );
    }
    if (error.message.includes('bad decrypt')) {
      throw new Error(
        'Decryption failed: Bad decryption (wrong key or corrupted data).'
      );
    }
    throw new Error('Decryption failed: ' + error.message);
  }
};

