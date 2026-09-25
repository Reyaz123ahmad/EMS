import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function uploadBase64Image(base64Data, folder = 'ems/general') {
  if (!base64Data) return null;
  return cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'auto'
  });
}

export async function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    uploadStream.end(buffer);
  });
}

export default cloudinary;

