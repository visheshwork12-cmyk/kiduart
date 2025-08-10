// tests/unit/services/enterpriseInfra.service.test.js
import enterpriseInfraService from '@api/v1/modules/superadmin/systemSettings/enterpriseInfra/enterpriseInfra.service.js';
import EnterpriseInfra from '@models/superadmin/enterpriseInfra.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@constants/index.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import mongoose from 'mongoose';

jest.mock('@models/superadmin/enterpriseInfra.model.js');
jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@lib/redis.js');

describe('EnterpriseInfra Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const settingsData = {
    cloudProviders: ['AWS'],
    dataCenterRegions: ['Mumbai'],
    highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
    distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
    automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
    disasterRecovery: { rpo: 5, rto: 15, drSite: 'AWS US-East-1' },
    aiDrivenLoadBalancing: { enabled: true, predictiveScaling: { threshold: 75, scaleFactor: 20 } },
    securitySettings: { encryptionAtRest: true, firewallEnabled: true, wafRules: ['SQLi', 'XSS'] },
    tenantId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue();
    redis.del.mockResolvedValue();
    redis.publish.mockResolvedValue();
  });

  describe('createEnterpriseInfra', () => {
    it('should create enterprise infra config', async () => {
      EnterpriseInfra.create.mockResolvedValue(settingsData);
      EnterpriseInfra.findOne.mockResolvedValue(null);
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await enterpriseInfraService.createEnterpriseInfra(settingsData, 'userId', tenantId, '127.0.0.1');
      expect(result).toEqual(settingsData);
      expect(EnterpriseInfra.create).toHaveBeenCalledWith({ ...settingsData, tenantId });
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'enterpriseInfra', action: 'create' }));
      expect(redis.set).toHaveBeenCalledWith(`enterpriseInfra:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Enterprise infra created for tenant ${tenantId}`);
    });

    it('should throw error if settings already exist', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(settingsData);
      await expect(enterpriseInfraService.createEnterpriseInfra(settingsData, 'userId', tenantId, '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS)
      );
    });
  });

  describe('getEnterpriseInfra', () => {
    it('should return enterprise infra config from cache', async () => {
      redis.get.mockResolvedValue(JSON.stringify(settingsData));
      const result = await enterpriseInfraService.getEnterpriseInfra(tenantId);
      expect(result).toEqual(settingsData);
      expect(EnterpriseInfra.findOne).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for enterprise infra for tenant ${tenantId}`);
    });

    it('should return enterprise infra config from database and cache it', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(settingsData);
      const result = await enterpriseInfraService.getEnterpriseInfra(tenantId);
      expect(result).toEqual(settingsData);
      expect(EnterpriseInfra.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`enterpriseInfra:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Enterprise infra cached for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(null);
      await expect(enterpriseInfraService.getEnterpriseInfra(tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('updateEnterpriseInfra', () => {
    it('should update enterprise infra config', async () => {
      const updateBody = { cloudProviders: ['Azure'] };
      const updatedSettings = { ...settingsData, ...updateBody };
      EnterpriseInfra.findOne.mockResolvedValue({ ...settingsData, save: jest.fn().mockResolvedValue(updatedSettings) });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await enterpriseInfraService.updateEnterpriseInfra(updateBody, 'userId', tenantId, '127.0.0.1');
      expect(result).toEqual(updatedSettings);
      expect(EnterpriseInfra.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`enterpriseInfra:${tenantId}`, expect.any(String), 'EX', 300);
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'enterpriseInfra', action: 'update' }));
      expect(logger.info).toHaveBeenCalledWith(`Enterprise infra updated for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(null);
      await expect(enterpriseInfraService.updateEnterpriseInfra({ cloudProviders: ['Azure'] }, 'userId', tenantId, '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('deleteEnterpriseInfra', () => {
    it('should soft delete enterprise infra config', async () => {
      EnterpriseInfra.findOne.mockResolvedValue({ ...settingsData, save: jest.fn().mockResolvedValue({ ...settingsData, isDeleted: true }) });
      SystemSettingsHistory.create.mockResolvedValue({});
      await enterpriseInfraService.deleteEnterpriseInfra(tenantId, 'userId', '127.0.0.1');
      expect(EnterpriseInfra.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.del).toHaveBeenCalledWith(`enterpriseInfra:${tenantId}`);
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'enterpriseInfra', action: 'delete' }));
      expect(logger.info).toHaveBeenCalledWith(`Enterprise infra deleted for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(null);
      await expect(enterpriseInfraService.deleteEnterpriseInfra(tenantId, 'userId', '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('validateInfrastructure', () => {
    it('should validate infrastructure config', async () => {
      const configData = { cloudProviders: ['AWS'], dataCenterRegions: ['Mumbai'] };
      const result = await enterpriseInfraService.validateInfrastructure(configData, tenantId);
      expect(result).toEqual({ valid: true, issues: [] });
      expect(logger.info).toHaveBeenCalledWith(`Infrastructure validated for tenant ${tenantId}`);
    });

    it('should throw error for invalid config', async () => {
      const configData = { cloudProviders: ['Invalid'], dataCenterRegions: ['Mumbai'] };
      await expect(enterpriseInfraService.validateInfrastructure(configData, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });
  });

  describe('getInfrastructureStatus', () => {
    it('should retrieve infrastructure status', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(settingsData);
      const result = await enterpriseInfraService.getInfrastructureStatus(tenantId);
      expect(result).toMatchObject({
        cloudProviders: settingsData.cloudProviders,
        regions: settingsData.dataCenterRegions,
        status: 'Operational',
      });
      expect(logger.info).toHaveBeenCalledWith(`Infrastructure status retrieved for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      EnterpriseInfra.findOne.mockResolvedValue(null);
      await expect(enterpriseInfraService.getInfrastructureStatus(tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });
});