/**
 * Face Similarity & Vector Mathematics Utility
 */

/**
 * Calculate Cosine Similarity between two embedding vectors
 * Returns a value between -1.0 and 1.0 (clamped to 0.0 - 1.0 for facial matching)
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new Error('Invalid embeddings for comparison: vectors must be arrays');
  }

  if (vecA.length === 0 || vecB.length === 0) {
    throw new Error('Invalid embeddings for comparison: vectors cannot be empty');
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    const valA = Number(vecA[i]) || 0;
    const valB = Number(vecB[i]) || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Round to 4 decimal places and clamp to [0.0, 1.0]
  return Math.max(0, Math.min(1, Math.round(similarity * 10000) / 10000));
}

/**
 * Calculate Euclidean Distance between two embedding vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number}
 */
export function euclideanDistance(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    throw new Error('Embedding length mismatch or invalid vectors');
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = (Number(vecA[i]) || 0) - (Number(vecB[i]) || 0);
    sum += diff * diff;
  }
  return Math.round(Math.sqrt(sum) * 10000) / 10000;
}

export default {
  cosineSimilarity,
  euclideanDistance
};
