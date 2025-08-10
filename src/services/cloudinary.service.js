import { uploadProfile } from '@integrations/cloudinary.js';
import CONSTANT from '@config/constants.js';
import redis from '@lib/redis.js'; // Use redis singleton instead of createClient
import logger from '@config/logger.js';
import responseFormatter from '@utils/responseFormatter.js';

const uploadImage = async (file, path) => {
  const cacheKey = `${file.originalname}:${path}`;
  
  // Try to get from cache using singleton redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache unavailable: ${error.message}`);
    // Continue without cache - graceful degradation
  }

  // Upload image
  try {
    const result = await uploadProfile(file, path);
    
    // Try to cache the result using singleton redis
    try {
      // Set cache with 10 minutes expiry
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 600);
      logger.info(`Cached result for ${cacheKey}`);
    } catch (cacheError) {
      logger.warn(`Failed to cache image: ${cacheError.message}`);
      // Continue even if caching fails
    }
    
    return responseFormatter(true, result, 'Image uploaded successfully', CONSTANT.SUCCESSFUL);
  } catch (error) {
    logger.error(`Image upload failed: ${error.message}`);
    return responseFormatter(false, {}, error.message, error.statusCode || CONSTANT.INTERNAL_SERVER_ERROR);
  }
  // No need for finally block - singleton redis handles its own connection
};

export default { uploadImage };
