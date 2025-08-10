// src/api/v1/modules/superadmin/auditLog/auditLog.service.js
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import EnterpriseInfra from '@models/superadmin/enterpriseInfra.model.js';
import FeatureFlags from '@models/superadmin/featureFlag.model.js';
import Role from '@models/superadmin/role.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import auditLogRepository from '@repositories/systemSettings/auditLog.repository.js';
import auditLogValidation from './auditLog.validations.js';

const getAuditLog = async (query, tenantId) => {
  const { error } = auditLogValidation.getAuditLog.query.validate(query);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const rateLimitKey = `auditLog:rate:${tenantId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 100) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many audit log requests');
  }
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  const auditLogs = await auditLogRepository.getAuditLog(query, tenantId);
  logger.info(`Audit log retrieved for tenant ${tenantId}`);
  return auditLogs;
};

const rollbackSettings = async (historyId, userId, tenantId, ip) => {
  const { error } = auditLogValidation.rollbackSettings.params.validate({ historyId });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const history = await SystemSettingsHistory.findOne({ _id: historyId, tenantId }).exec();
  if (!history) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Audit log entry not found');
  }
  let settings;
  switch (history.module) {
    case 'securityFramework':
      settings = await SecurityFramework.findOneAndUpdate(
        { tenantId, isDeleted: false },
        { $set: history.previousValue },
        { new: true }
      ).exec();
      break;
    case 'coreSystemConfig':
      settings = await CoreSystemConfig.findOneAndUpdate(
        { tenantId, isDeleted: false },
        { $set: history.previousValue },
        { new: true }
      ).exec();
      break;
    case 'enterpriseInfra':
      settings = await EnterpriseInfra.findOneAndUpdate(
        { tenantId, isDeleted: false },
        { $set: history.previousValue },
        { new: true }
      ).exec();
      break;
    case 'featureFlags':
      settings = await FeatureFlags.findOneAndUpdate(
        { tenantId, isDeleted: false },
        { $set: history.previousValue },
        { new: true }
      ).exec();
      break;
    case 'rbac':
      settings = await Role.findOneAndUpdate(
        { tenantId, _id: history.previousValue._id, isDeleted: false },
        { $set: history.previousValue },
        { new: true }
      ).exec();
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid module for rollback');
  }
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, `${history.module} settings not found`);
  }
  await SystemSettingsHistory.create({
    tenantId,
    module: history.module,
    action: 'rollback',
    previousValue: history.newValue,
    newValue: history.previousValue,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish(`settings:${history.module}`, JSON.stringify({ tenantId, action: 'rollback' }));
  await redis.del(`securityFramework:${tenantId}`);
  logger.info(`Rolled back settings for module ${history.module} by user ${userId} for tenant ${tenantId}`);
  return settings;
};

const deleteAuditLogs = async (query, tenantId, userId, ip) => {
  const { error } = auditLogValidation.deleteAuditLogs.query.validate(query);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  await auditLogRepository.deleteAuditLogs(query, tenantId);
  await redis.del(`auditLog:${tenantId}:*`);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'auditLog',
    action: 'delete',
    previousValue: query,
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  logger.info(`Audit logs deleted for tenant ${tenantId}`);
};

const getAuditLogStats = async (query, tenantId) => {
  const { error } = auditLogValidation.getAuditLogStats.query.validate(query);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const rateLimitKey = `auditLog:stats:rate:${tenantId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 50) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many audit log stats requests');
  }
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  const stats = await auditLogRepository.getAuditLogStats(query, tenantId);
  logger.info(`Audit log stats retrieved for tenant ${tenantId}`);
  return stats;
};

const purgeCache = async (tenantId, userId, ip) => {
  await redis.del(`auditLog:${tenantId}:*`);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'auditLog',
    action: 'purge_cache',
    previousValue: {},
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  logger.info(`Audit log cache purged for tenant ${tenantId}`);
};

const logAction = async (action, userId, module, details, ipAddress, tenantId = null) => {
  try {
    const auditLog = await AuditLog.create({
      tenantId,
      userId,
      action,
      module,
      details,
      ipAddress,
    });
    logger.info(`Audit log created: ${action} on ${module} by ${userId || 'system'}${tenantId ? ` for tenant ${tenantId}` : ''}`);
    return auditLog;
  } catch (error) {
    logger.error(`Failed to log audit action: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

export default {
  getAuditLog,
  rollbackSettings,
  deleteAuditLogs,
  getAuditLogStats,
  purgeCache,
  logAction,
};