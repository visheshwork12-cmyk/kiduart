// src/api/v1/modules/superadmin/featureFlag/featureFlag.repository.js
import FeatureFlag from '@models/superadmin/featureFlag.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';

const getFeatureFlags = async ({ tenantId, page = 1, limit = 20 }) => {
  const cacheKey = `featureFlag:${tenantId}:${page}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for feature flags for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const flags = await FeatureFlag.findOne({ tenantId, isDeleted: false })
    .select('flags')
    .lean()
    .exec();
  if (!flags) {
    return { data: [], total: 0, page: parseInt(page), limit: parseInt(limit) };
  }
  const filteredFlags = flags.flags.filter(f => !f.isDeleted);
  const total = filteredFlags.length;
  const paginatedFlags = filteredFlags.slice((page - 1) * limit, page * limit);
  const result = { data: paginatedFlags, total, page: parseInt(page), limit: parseInt(limit) };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
  logger.info(`Feature flags cached for tenant ${tenantId}`);
  return result;
};

export default {
  getFeatureFlags,
};