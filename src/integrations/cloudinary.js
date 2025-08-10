import { v2 as cloudinary } from 'cloudinary';
import config from '@config/index.js';
import logger from '@config/logger.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadProfile = async (file, folder) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export { uploadProfile };