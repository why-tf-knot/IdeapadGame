/**
 * Message Encryption Service
 * 
 * Provides AES-256-CBC encryption for chat messages between founders and investors.
 * Each thread gets its own encryption key derived from the master key + thread context.
 * Messages are encrypted at rest and only decrypted when delivered to authorized users.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = process.env.ENCRYPTION_KEY || '32-char-encryption-key-for-msgs!';

/**
 * Derive a thread-specific key from the master key + thread identifiers.
 * This ensures each conversation has a unique encryption context.
 */
export function deriveThreadKey(
  ideaId: string,
  founderId: string,
  investorId: string
): string {
  const material = `${ideaId}:${founderId}:${investorId}`;
  return crypto
    .createHmac('sha256', MASTER_KEY)
    .update(material)
    .digest('hex')
    .substring(0, 32); // AES-256 needs exactly 32 bytes
}

/**
 * Encrypt a plaintext message.
 * Returns { encryptedText, iv, hash } for storage.
 */
export function encryptMessage(
  plaintext: string,
  threadKey: string
): { encryptedText: string; iv: string; hash: string } {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(threadKey, 'utf-8');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Integrity hash of the plaintext
  const hash = crypto.createHash('sha256').update(plaintext).digest('hex');

  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    hash,
  };
}

/**
 * Decrypt a stored message.
 * Verifies integrity hash after decryption.
 */
export function decryptMessage(
  encryptedText: string,
  iv: string,
  hash: string,
  threadKey: string
): string {
  const key = Buffer.from(threadKey, 'utf-8');
  const ivBuffer = Buffer.from(iv, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // Verify integrity
  const computedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
  if (computedHash !== hash) {
    throw new Error('Message integrity check failed — possible tampering detected');
  }

  return decrypted;
}

/**
 * Generate a secure random correlation ID for distributed tracing.
 */
export function generateCorrelationId(): string {
  return `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate a unique transfer ID (idempotency key).
 */
export function generateTransferId(): string {
  return `xfr_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;
}
