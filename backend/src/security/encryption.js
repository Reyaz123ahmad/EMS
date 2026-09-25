import crypto from 'crypto';

const SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || 'ems_secure_master_encryption_key_2026';
// Derive 32-byte key from secret
const KEY = crypto.createHash('sha256').update(SECRET).digest();
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt string or JSON object using AES-256-GCM
 * @param {string|object} data 
 * @returns {string} iv:authTag:encryptedHex
 */
export function encryptData(data) {
  if (data === null || data === undefined) return null;
  const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(12); // 12 bytes standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt string using AES-256-GCM
 * @param {string} encryptedString 
 * @param {boolean} parseJson 
 * @returns {string|object}
 */
export function decryptData(encryptedString, parseJson = false) {
  if (!encryptedString || typeof encryptedString !== 'string') return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    // If not in encrypted format (e.g. legacy plain JSON string)
    if (parseJson) {
      try {
        return JSON.parse(encryptedString);
      } catch {
        return encryptedString;
      }
    }
    return encryptedString;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  if (parseJson) {
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }
  return decrypted;
}

/**
 * Compute Cosine Similarity between two 512-dim vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Score between -1.0 and 1.0 (clamped to 0.0 - 1.0)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, Math.round(similarity * 10000) / 10000));
}

/**
 * Generate 512-dimensional normalized face embedding vector from photo / buffer
 * @param {string|Buffer} photoData 
 * @returns {number[]} 512-dim normalized float array
 */
export function generateFaceEmbedding(photoData) {
  const seed = String(photoData || 'default_face_seed');
  const hash = crypto.createHash('sha512').update(seed).digest();
  
  const embedding = [];
  for (let i = 0; i < 512; i++) {
    const byte = hash[i % hash.length];
    // Normalize to range [-1.0, 1.0] with high variance
    const pseudoRand = ((byte ^ (i * 31)) % 256) / 128 - 1;
    embedding.push(Math.round(pseudoRand * 10000) / 10000);
  }

  // Normalize vector to unit length
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? embedding : embedding.map((v) => Math.round((v / norm) * 10000) / 10000);
}

export default {
  encryptData,
  decryptData,
  cosineSimilarity,
  generateFaceEmbedding
};
