import EnterpriseInfra from '@models/superadmin/enterpriseInfra.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';
import enterpriseInfraValidation from './enterpriseInfra.validations.js';
import enterpriseInfraRepository from '@repositories/systemSettings/enterpriseInfra.repository.js';

const createEnterpriseInfra = async (configData, userId, tenantId, ip) => {
  const { error } = enterpriseInfraValidation.createEnterpriseInfra.body.validate(configData);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }
  const existingConfig = await enterpriseInfraRepository.getEnterpriseInfra(tenantId);
  if (existingConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  }
  const config = await enterpriseInfraRepository.createEnterpriseInfra({ ...configData, tenantId });
  await SystemSettingsHistory.create({
    tenantId,
    module: 'enterpriseInfra',
    action: 'create',
    newValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:enterpriseInfra', JSON.stringify({ tenantId, action: 'create' }));
  logger.info(`Enterprise infra created for tenant ${tenantId}`);
  return config;
};

const getEnterpriseInfra = async (tenantId) => {
  const config = await enterpriseInfraRepository.getEnterpriseInfra(tenantId);
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  return config;
};

const updateEnterpriseInfra = async (updateBody, userId, tenantId, ip) => {
  const { error } = enterpriseInfraValidation.updateEnterpriseInfra.body.validate(updateBody);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }
  const config = await enterpriseInfraRepository.updateEnterpriseInfra(updateBody, tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'enterpriseInfra',
    action: 'update',
    previousValue: config._previousDataValues,
    newValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:enterpriseInfra', JSON.stringify({ tenantId, action: 'update' }));
  logger.info(`Enterprise infra updated for tenant ${tenantId}`);
  return config;
};

const deleteEnterpriseInfra = async (tenantId, userId, ip) => {
  const config = await enterpriseInfraRepository.getEnterpriseInfra(tenantId);
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  await enterpriseInfraRepository.deleteEnterpriseInfra(tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'enterpriseInfra',
    action: 'delete',
    previousValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:enterpriseInfra', JSON.stringify({ tenantId, action: 'delete' }));
  logger.info(`Enterprise infra deleted for tenant ${tenantId}`);
};

const validateInfrastructure = async (configData, tenantId) => {
  const { error } = enterpriseInfraValidation.createEnterpriseInfra.body.validate(configData);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }
  // Placeholder for infrastructure validation logic (e.g., check cloud provider compatibility)
  const validationResult = { valid: true, issues: [] };
  logger.info(`Infrastructure validated for tenant ${tenantId}`);
  return validationResult;
};

const getInfrastructureStatus = async (tenantId) => {
  const config = await enterpriseInfraRepository.getEnterpriseInfra(tenantId);
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  // Placeholder for infrastructure status check (e.g., cloud provider API call)
  const status = {
    cloudProviders: config.cloudProviders,
    regions: config.dataCenterRegions,
    status: 'Operational',
    lastChecked: new Date(),
  };
  logger.info(`Infrastructure status retrieved for tenant ${tenantId}`);
  return status;
};

export default {
  createEnterpriseInfra,
  getEnterpriseInfra,
  updateEnterpriseInfra,
  deleteEnterpriseInfra,
  validateInfrastructure,
  getInfrastructureStatus,
};