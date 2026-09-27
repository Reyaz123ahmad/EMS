import * as faceService from '../../services/face.service.js';

/**
 * Face Recognition Client
 * Handles neural facial feature detection and 128-dimensional vector embedding extraction
 */
export class FaceClient {
  /**
   * Extract facial vector descriptor from base64 photo or image buffer
   * @param {string|Buffer} photoData 
   * @returns {Promise<number[]|null>} 128-dimensional unit-normalized vector or null if no face
   */
  static async generateEmbedding(photoData) {
    if (!photoData) return null;
    let base64 = typeof photoData === 'string' ? photoData : photoData.toString('base64');
    return await faceService.generateEmbedding(base64);
  }
}

export const generateEmbedding = FaceClient.generateEmbedding;
export default FaceClient;
