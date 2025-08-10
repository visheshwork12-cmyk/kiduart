import EnterpriseInfra from '@models/superadmin/enterpriseInfra.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';

const createEnterpriseInfra = async (configData) => {
  const config = await EnterpriseInfra.create(configData);
  const cacheKey = `enterpriseInfra:${configData.tenantId}`;
  await redis.set(cacheKey, JSON.stringify(config), 'EX', 300);
  logger.info(`Enterprise infra created and cached for tenant ${configData.tenantId}`);
  return config;
};

const getEnterpriseInfra = async (tenantId) => {
  const cacheKey = `enterpriseInfra:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for enterprise infra for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const config = await EnterpriseInfra.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  await redis.set(cacheKey, JSON.stringify(config), 'EX', 300);
  logger.info(`Enterprise infra cached for tenant ${tenantId}`);
  return config;
};

const updateEnterpriseInfra = async (updateBody, tenantId) => {
  const config = await EnterpriseInfra.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  Object.assign(config, updateBody);
  await config.save();
  const cacheKey = `enterpriseInfra:${tenantId}`;
  await redis.set(cacheKey, JSON.stringify(config), 'EX', 300);
  logger.info(`Enterprise infra cache updated for tenant ${tenantId}`);
  return config;
};

const deleteEnterpriseInfra = async (tenantId) => {
  const config = await EnterpriseInfra.findOne({ tenantId, isDeleted: false }).exec();
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  config.isDeleted = true;
  await config.save();
  const cacheKey = `enterpriseInfra:${tenantId}`;
  await redis.del(cacheKey);
  logger.info(`Enterprise infra deleted and cache cleared for tenant ${tenantId}`);
};

export default {
  createEnterpriseInfra,
  getEnterpriseInfra,
  updateEnterpriseInfra,
  deleteEnterpriseInfra,
};