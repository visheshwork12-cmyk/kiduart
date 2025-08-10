// src/api/v1/modules/superadmin/securityFramework/securityFramework.repository.js
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';

const createSecurityFramework = async (settingsData) => {
  const settings = await SecurityFramework.create(settingsData);
  const cacheKey = `securityFramework:${settingsData.tenantId}`;
  await redis.set(cacheKey, JSON.stringify(settings), 'EX', 300);
  logger.info(`Security framework created and cached for tenant ${settingsData.tenantId}`);
  return settings;
};

const getSecurityFramework = async (tenantId) => {
  const cacheKey = `securityFramework:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for security framework for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const settings = await SecurityFramework.findOne({ tenantId, isDeleted: false }).exec();
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  await redis.set(cacheKey, JSON.stringify(settings), 'EX', 300);
  logger.info(`Security framework cached for tenant ${tenantId}`);
  return settings;
};

const updateSecurityFramework = async (updateBody, tenantId) => {
  const settings = await SecurityFramework.findOne({ tenantId, isDeleted: false }).exec();
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  Object.assign(settings, updateBody);
  await settings.save();
  const cacheKey = `securityFramework:${tenantId}`;
  await redis.set(cacheKey, JSON.stringify(settings), 'EX', 300);
  logger.info(`Security framework cache updated for tenant ${tenantId}`);
  return settings;
};

const deleteSecurityFramework = async (tenantId) => {
  const settings = await SecurityFramework.findOne({ tenantId, isDeleted: false }).exec();
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  settings.isDeleted = true;
  await settings.save();
  const cacheKey = `securityFramework:${tenantId}`;
  await redis.del(cacheKey);
  logger.info(`Security framework deleted and cache cleared for tenant ${tenantId}`);
};

export default {
  createSecurityFramework,
  getSecurityFramework,
  updateSecurityFramework,
  deleteSecurityFramework,
};