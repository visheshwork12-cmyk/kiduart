// src/api/v1/modules/superadmin/auditLog/auditLog.repository.js
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';

const getAuditLog = async (query, tenantId) => {
  const { module, startDate, endDate, action, userId, page = 1, limit = 20 } = query;
  const cacheKey = `auditLog:${tenantId}:${module || 'all'}:${startDate || 'noStart'}:${endDate || 'noEnd'}:${action || 'all'}:${userId || 'all'}:${page}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for audit log for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const filter = { tenantId };
  if (module) filter.module = module;
  if (action) filter.action = action;
  if (userId) filter.changedBy = userId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const auditLogs = await SystemSettingsHistory.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .exec();
  const total = await SystemSettingsHistory.countDocuments(filter);
  const result = { data: auditLogs, total, page: parseInt(page), limit: parseInt(limit) };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
  logger.info(`Audit log cached for tenant ${tenantId}`);
  return result;
};

const deleteAuditLogs = async (query, tenantId) => {
  const { module, startDate, endDate, action, userId } = query;
  const filter = { tenantId };
  if (module) filter.module = module;
  if (action) filter.action = action;
  if (userId) filter.changedBy = userId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const result = await SystemSettingsHistory.deleteMany(filter).exec();
  if (result.deletedCount === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No audit logs found to delete');
  }
  logger.info(`Deleted ${result.deletedCount} audit logs for tenant ${tenantId}`);
};

const getAuditLogStats = async (query, tenantId) => {
  const { startDate, endDate } = query;
  const filter = { tenantId };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const stats = await SystemSettingsHistory.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          module: '$module',
          action: '$action',
        },
        count: { $sum: 1 },
        users: { $addToSet: '$changedBy' },
      },
    },
    {
      $project: {
        module: '$_id.module',
        action: '$_id.action',
        count: 1,
        userCount: { $size: '$users' },
        _id: 0,
      },
    },
  ]).exec();
  return stats;
};

export default {
  getAuditLog,
  deleteAuditLogs,
  getAuditLogStats,
};