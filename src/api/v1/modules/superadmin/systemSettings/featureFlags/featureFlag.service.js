// src/api/v1/modules/superadmin/featureFlag/featureFlag.service.js
import FeatureFlag from '@models/superadmin/featureFlag.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';
import featureFlagRepository from '@repositories/systemSettings/featureFlag.repository.js';
import featureFlagValidation from './featureFlag.validations.js';

const createFeatureFlag = async (flagData, tenantId, userId, ip) => {
  const { error } = featureFlagValidation.createFeatureFlag.body.validate(flagData);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const existingFlags = await featureFlagRepository.getFeatureFlags({ tenantId });
  if (existingFlags && existingFlags.flags.find(f => f.name === flagData.name && !f.isDeleted)) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.FEATURE_FLAG_ALREADY_EXISTS);
  }
  let flags = existingFlags;
  if (!flags) {
    flags = await FeatureFlag.create({ tenantId, flags: [], isDeleted: false });
  }
  flags.flags.push({ name: flagData.name, enabled: flagData.enabled });
  await flags.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'create',
    newValue: { name: flagData.name, enabled: flagData.enabled },
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`featureFlag:${tenantId}`);
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'create' }));
  logger.info(`Feature flag ${flagData.name} created for tenant ${tenantId}`);
  return flags;
};

const bulkCreateFeatureFlags = async (flagsData, tenantId, userId, ip) => {
  const { error } = featureFlagValidation.bulkCreateFeatureFlags.body.validate({ flags: flagsData });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  let flags = await featureFlagRepository.getFeatureFlags({ tenantId });
  if (!flags) {
    flags = await FeatureFlag.create({ tenantId, flags: [], isDeleted: false });
  }
  const existingFlagNames = flags.flags.filter(f => !f.isDeleted).map(f => f.name);
  const newFlags = flagsData.filter(f => !existingFlagNames.includes(f.name));
  if (newFlags.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All provided flags already exist');
  }
  newFlags.forEach(flag => {
    flags.flags.push({ name: flag.name, enabled: flag.enabled });
  });
  await flags.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'bulk_create',
    newValue: newFlags,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`featureFlag:${tenantId}`);
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'bulk_create' }));
  logger.info(`Bulk feature flags created for tenant ${tenantId}`);
  return flags;
};

const getFeatureFlags = async (query, tenantId) => {
  const { error } = featureFlagValidation.getFeatureFlags.query.validate(query);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const rateLimitKey = `featureFlag:rate:${tenantId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 100) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many feature flag requests');
  }
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  const flags = await featureFlagRepository.getFeatureFlags({ ...query, tenantId });
  logger.info(`Feature flags retrieved for tenant ${tenantId}`);
  return flags;
};

const updateFeatureFlag = async (name, enabled, tenantId, userId, ip) => {
  const { error } = featureFlagValidation.updateFeatureFlag.validate({ params: { name }, body: { enabled } });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const flags = await featureFlagRepository.getFeatureFlags({ tenantId });
  if (!flags || !flags.flags.find(f => f.name === name && !f.isDeleted)) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  }
  const flag = flags.flags.find(f => f.name === name && !f.isDeleted);
  const previousEnabled = flag.enabled;
  flag.enabled = enabled;
  flag.updatedAt = new Date();
  await flags.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'update',
    previousValue: { name, enabled: previousEnabled },
    newValue: { name, enabled },
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`featureFlag:${tenantId}`);
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'update' }));
  logger.info(`Feature flag ${name} updated for tenant ${tenantId}`);
  return flags;
};

const toggleFeatureFlag = async (name, tenantId, userId, ip) => {
  const { error } = featureFlagValidation.toggleFeatureFlag.params.validate({ name });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const flags = await featureFlagRepository.getFeatureFlags({ tenantId });
  if (!flags || !flags.flags.find(f => f.name === name && !f.isDeleted)) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  }
  const flag = flags.flags.find(f => f.name === name && !f.isDeleted);
  const previousEnabled = flag.enabled;
  flag.enabled = !flag.enabled;
  flag.updatedAt = new Date();
  await flags.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'toggle',
    previousValue: { name, enabled: previousEnabled },
    newValue: { name, enabled: flag.enabled },
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`featureFlag:${tenantId}`);
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'toggle' }));
  logger.info(`Feature flag ${name} toggled for tenant ${tenantId}`);
  return flags;
};

const deleteFeatureFlag = async (name, tenantId, userId, ip) => {
  const { error } = featureFlagValidation.deleteFeatureFlag.params.validate({ name });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const flags = await featureFlagRepository.getFeatureFlags({ tenantId });
  if (!flags || !flags.flags.find(f => f.name === name && !f.isDeleted)) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  }
  const flag = flags.flags.find(f => f.name === name && !f.isDeleted);
  flag.isDeleted = true;
  flag.updatedAt = new Date();
  await flags.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'delete',
    previousValue: { name, enabled: flag.enabled },
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`featureFlag:${tenantId}`);
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'delete' }));
  logger.info(`Feature flag ${name} deleted for tenant ${tenantId}`);
};

const purgeCache = async (tenantId, userId, ip) => {
  await redis.del(`featureFlag:${tenantId}`);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'featureFlag',
    action: 'purge_cache',
    previousValue: {},
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:featureFlag', JSON.stringify({ tenantId, action: 'purge_cache' }));
  logger.info(`Feature flag cache purged for tenant ${tenantId}`);
};

export default {
  createFeatureFlag,
  bulkCreateFeatureFlags,
  getFeatureFlags,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
  purgeCache,
};