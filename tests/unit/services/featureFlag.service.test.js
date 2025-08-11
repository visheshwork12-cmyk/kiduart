// tests/unit/services/featureFlag.service.test.js
import featureFlagService from '@api/v1/modules/superadmin/systemSettings/featureFlags/featureFlag.service.js';
import FeatureFlag from '@models/superadmin/featureFlag.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import mongoose from 'mongoose';
import CONSTANTS from '@constants/index.js';

jest.mock('@models/superadmin/featureFlag.model.js');
jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@lib/redis.js');
jest.mock('@config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('FeatureFlag Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const ip = '127.0.0.1';
  const flagData = { name: 'multi_factor_auth', enabled: true };
  const flagsDoc = {
    tenantId,
    flags: [{ name: 'multi_factor_auth', enabled: true, isDeleted: false }],
    isDeleted: false,
    save: jest.fn().mockResolvedValueThis(),
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

  describe('createFeatureFlag', () => {
    it('should create a new feature flag', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      FeatureFlag.create.mockResolvedValue(flagsDoc);
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await featureFlagService.createFeatureFlag(flagData, tenantId, userId, ip);
      expect(result).toEqual(flagsDoc);
      expect(FeatureFlag.create).toHaveBeenCalledWith({ tenantId, flags: [], isDeleted: false });
      expect(flagsDoc.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Feature flag ${flagData.name} created for tenant ${tenantId}`);
    });

    it('should throw error if flag already exists', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) });
      await expect(featureFlagService.createFeatureFlag(flagData, tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.FEATURE_FLAG_ALREADY_EXISTS)
      );
    });
  });

  describe('bulkCreateFeatureFlags', () => {
    it('should create multiple feature flags', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      FeatureFlag.create.mockResolvedValue(flagsDoc);
      SystemSettingsHistory.create.mockResolvedValue({});
      const flags = [flagData, { name: 'compliance_reports', enabled: false }];
      const result = await featureFlagService.bulkCreateFeatureFlags(flags, tenantId, userId, ip);
      expect(result).toEqual(flagsDoc);
      expect(flagsDoc.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Bulk feature flags created for tenant ${tenantId}`);
    });

    it('should throw error if all flags already exist', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) });
      await expect(featureFlagService.bulkCreateFeatureFlags([flagData], tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'All provided flags already exist')
      );
    });
  });

  describe('getFeatureFlags', () => {
    it('should retrieve feature flags from cache', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ data: [flagData], total: 1, page: 1, limit: 10 }));
      const result = await featureFlagService.getFeatureFlags({ page: 1, limit: 10 }, tenantId);
      expect(result).toEqual({ data: [flagData], total: 1, page: 1, limit: 10 });
      expect(FeatureFlag.findOne).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for feature flags for tenant ${tenantId}`);
    });

    it('should retrieve feature flags from database', async () => {
      FeatureFlag.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) }) }) });
      const result = await featureFlagService.getFeatureFlags({ page: 1, limit: 10 }, tenantId);
      expect(result.data).toEqual([flagData]);
      expect(redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Feature flags cached for tenant ${tenantId}`);
    });

    it('should throw error for too many requests', async () => {
      redis.get.mockResolvedValue('100');
      await expect(featureFlagService.getFeatureFlags({}, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many feature flag requests')
      );
    });
  });

  describe('updateFeatureFlag', () => {
    it('should update a feature flag', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await featureFlagService.updateFeatureFlag(flagData.name, false, tenantId, userId, ip);
      expect(result).toEqual(flagsDoc);
      expect(flagsDoc.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Feature flag ${flagData.name} updated for tenant ${tenantId}`);
    });

    it('should throw error if flag not found', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(featureFlagService.updateFeatureFlag('unknown_flag', false, tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND)
      );
    });
  });

  describe('toggleFeatureFlag', () => {
    it('should toggle a feature flag', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await featureFlagService.toggleFeatureFlag(flagData.name, tenantId, userId, ip);
      expect(result).toEqual(flagsDoc);
      expect(flagsDoc.flags[0].enabled).toBe(false);
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Feature flag ${flagData.name} toggled for tenant ${tenantId}`);
    });

    it('should throw error if flag not found', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(featureFlagService.toggleFeatureFlag('unknown_flag', tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND)
      );
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should delete a feature flag', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(flagsDoc) });
      SystemSettingsHistory.create.mockResolvedValue({});
      await featureFlagService.deleteFeatureFlag(flagData.name, tenantId, userId, ip);
      expect(flagsDoc.flags[0].isDeleted).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Feature flag ${flagData.name} deleted for tenant ${tenantId}`);
    });

    it('should throw error if flag not found', async () => {
      FeatureFlag.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(featureFlagService.deleteFeatureFlag('unknown_flag', tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND)
      );
    });
  });

  describe('purgeCache', () => {
    it('should purge feature flag cache', async () => {
      SystemSettingsHistory.create.mockResolvedValue({});
      await featureFlagService.purgeCache(tenantId, userId, ip);
      expect(redis.del).toHaveBeenCalledWith(`featureFlag:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Feature flag cache purged for tenant ${tenantId}`);
    });
  });
});