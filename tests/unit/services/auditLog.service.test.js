// tests/unit/services/auditLog.service.test.js
import auditLogService from '@api/v1/modules/superadmin/auditLog/auditLog.service.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import mongoose from 'mongoose';

jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@models/superadmin/securityFramework.model.js');
jest.mock('@lib/redis.js');
jest.mock('@config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('AuditLog Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const ip = '127.0.0.1';

  const auditLogData = {
    tenantId,
    module: 'securityFramework',
    action: 'create',
    previousValue: {},
    newValue: { encryption: { standard: 'AES-256' } },
    changedBy: userId,
    ipAddress: ip,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(1);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    redis.publish.mockResolvedValue(1);
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  describe('getAuditLog', () => {
    it('should retrieve audit logs from cache', async () => {
      const query = { module: 'securityFramework', page: 1, limit: 10 };
      redis.get.mockResolvedValue(JSON.stringify({ data: [auditLogData], total: 1, page: 1, limit: 10 }));
      const result = await auditLogService.getAuditLog(query, tenantId);
      expect(result).toEqual({ data: [auditLogData], total: 1, page: 1, limit: 10 });
      expect(SystemSettingsHistory.find).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for audit log for tenant ${tenantId}`);
    });

    it('should retrieve audit logs from database', async () => {
      const query = { module: 'securityFramework', page: 1, limit: 10 };
      SystemSettingsHistory.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([auditLogData]),
      });
      SystemSettingsHistory.countDocuments.mockResolvedValue(1);
      const result = await auditLogService.getAuditLog(query, tenantId);
      expect(result).toEqual({ data: [auditLogData], total: 1, page: 1, limit: 10 });
      expect(SystemSettingsHistory.find).toHaveBeenCalledWith({ tenantId, module: 'securityFramework' });
      expect(redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Audit log cached for tenant ${tenantId}`);
    });

    it('should throw error for invalid query', async () => {
      const query = { startDate: 'invalid-date' };
      await expect(auditLogService.getAuditLog(query, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });

    it('should throw error for too many requests', async () => {
      redis.get.mockResolvedValue('100');
      await expect(auditLogService.getAuditLog({}, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many audit log requests')
      );
    });
  });

  describe('rollbackSettings', () => {
    it('should rollback securityFramework settings', async () => {
      SystemSettingsHistory.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(auditLogData),
      });
      SecurityFramework.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...auditLogData.newValue, tenantId, isDeleted: false }),
      });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await auditLogService.rollbackSettings(auditLogData._id, userId, tenantId, ip);
      expect(result).toEqual({ ...auditLogData.newValue, tenantId, isDeleted: false });
      expect(SecurityFramework.findOneAndUpdate).toHaveBeenCalledWith(
        { tenantId, isDeleted: false },
        { $set: auditLogData.previousValue },
        { new: true }
      );
      expect(redis.del).toHaveBeenCalledWith(`securityFramework:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Rolled back settings for module securityFramework by user ${userId} for tenant ${tenantId}`);
    });

    it('should throw error if history not found', async () => {
      SystemSettingsHistory.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(auditLogService.rollbackSettings('invalid-id', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Audit log entry not found')
      );
    });

    it('should throw error if settings not found', async () => {
      SystemSettingsHistory.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(auditLogData),
      });
      SecurityFramework.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(auditLogService.rollbackSettings(auditLogData._id, userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'securityFramework settings not found')
      );
    });
  });

  describe('deleteAuditLogs', () => {
    it('should delete audit logs', async () => {
      SystemSettingsHistory.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      SystemSettingsHistory.create.mockResolvedValue({});
      await auditLogService.deleteAuditLogs({ module: 'securityFramework' }, tenantId, userId, ip);
      expect(SystemSettingsHistory.deleteMany).toHaveBeenCalledWith({ tenantId, module: 'securityFramework' });
      expect(redis.del).toHaveBeenCalledWith(`auditLog:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Deleted 1 audit logs for tenant ${tenantId}`);
    });

    it('should throw error if no logs found', async () => {
      SystemSettingsHistory.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });
      await expect(auditLogService.deleteAuditLogs({ module: 'securityFramework' }, tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'No audit logs found to delete')
      );
    });
  });

  describe('getAuditLogStats', () => {
    it('should retrieve audit log stats', async () => {
      SystemSettingsHistory.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { module: 'securityFramework', action: 'create', count: 1, userCount: 1 },
        ]),
      });
      const result = await auditLogService.getAuditLogStats({}, tenantId);
      expect(result).toEqual([{ module: 'securityFramework', action: 'create', count: 1, userCount: 1 }]);
      expect(SystemSettingsHistory.aggregate).toHaveBeenCalledWith(expect.any(Array));
      expect(logger.info).toHaveBeenCalledWith(`Audit log stats retrieved for tenant ${tenantId}`);
    });

    it('should throw error for too many requests', async () => {
      redis.get.mockResolvedValue('50');
      await expect(auditLogService.getAuditLogStats({}, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many audit log stats requests')
      );
    });
  });

  describe('purgeCache', () => {
    it('should purge audit log cache', async () => {
      SystemSettingsHistory.create.mockResolvedValue({});
      await auditLogService.purgeCache(tenantId, userId, ip);
      expect(redis.del).toHaveBeenCalledWith(`auditLog:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Audit log cache purged for tenant ${tenantId}`);
    });
  });
});