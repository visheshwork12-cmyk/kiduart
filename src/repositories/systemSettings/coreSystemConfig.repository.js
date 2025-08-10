import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';

const createCoreSystemConfig = async (configData) => {
  try {
    const config = await CoreSystemConfig.create(configData);
    const cacheKey = `coreSystemConfig:${configData.tenantId}`;
    await redis.set(cacheKey, JSON.stringify(config), 'EX', config.cacheTtl || 300);
    logger.info(`Core system config cached for tenant ${configData.tenantId}`);
    return config;
  } catch (error) {
    logger.error('Failed to create core system config', { message: error.message, stack: error.stack });
    throw error;
  }
};

const getCoreSystemConfig = async (tenantId) => {
  const cacheKey = `coreSystemConfig:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for core system config for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const config = await CoreSystemConfig.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  await redis.set(cacheKey, JSON.stringify(config), 'EX', config.cache.ttl || 300);
  logger.info(`Core system config cached for tenant ${tenantId}`);
  return config;
};

const updateCoreSystemConfig = async (updateBody, tenantId) => {
  const config = await CoreSystemConfig.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  Object.assign(config, updateBody);
  await config.save();
  const cacheKey = `coreSystemConfig:${tenantId}`;
  await redis.set(cacheKey, JSON.stringify(config), 'EX', config.cache.ttl || 300);
  logger.info(`Core system config cache updated for tenant ${tenantId}`);
  return config;
};

const deleteCoreSystemConfig = async (tenantId) => {
  const config = await CoreSystemConfig.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  config.isDeleted = true;
  await config.save();
  const cacheKey = `coreSystemConfig:${tenantId}`;
  await redis.del(cacheKey);
  logger.info(`Core system config deleted and cache cleared for tenant ${tenantId}`);
};

export default {
  createCoreSystemConfig,
  getCoreSystemConfig,
  updateCoreSystemConfig,
  deleteCoreSystemConfig,
};