import coreSystemConfigService from '@api/v1/modules/superadmin/systemSettings/coreSystemConfig/coreSystemConfig.service.js';
import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@constants/index.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import { format, parse } from 'date-fns';
import ntpClient from 'ntp-client';
import mongoose from 'mongoose';

jest.mock('@models/superadmin/coreSystemConfig.model.js');
jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@lib/redis.js');
jest.mock('ntp-client');
jest.mock('date-fns');

describe('CoreSystemConfig Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const settingsData = {
    systemIdentifier: 'xAI EduCore v3.0',
    version: '3.0.1',
    operationalMode: 'production',
    sandboxMode: false,
    ntpServer: 'pool.ntp.org',
    fallbackNtpServers: ['time.google.com'],
    syncInterval: 60,
    timeZone: 'UTC',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    locale: 'en-US',
    language: 'en',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
    cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
    encryptionSettings: { enabled: false },
    tenantId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue();
    redis.del.mockResolvedValue();
    redis.publish.mockResolvedValue();
  });

  describe('createCoreSystemConfig', () => {
    it('should create core system config', async () => {
      CoreSystemConfig.create.mockResolvedValue(settingsData);
      CoreSystemConfig.findOne.mockResolvedValue(null);
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await coreSystemConfigService.createCoreSystemConfig(settingsData, 'userId', tenantId, '127.0.0.1');
      expect(result).toEqual(settingsData);
      expect(CoreSystemConfig.create).toHaveBeenCalledWith({ ...settingsData, tenantId });
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'coreSystemConfig', action: 'create' }));
      expect(redis.set).toHaveBeenCalledWith(`coreSystemConfig:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Core system config created for tenant ${tenantId}`);
    });

    it('should throw error if settings already exist', async () => {
      CoreSystemConfig.findOne.mockResolvedValue(settingsData);
      await expect(coreSystemConfigService.createCoreSystemConfig(settingsData, 'userId', tenantId, '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS)
      );
    });
  });

  describe('getCoreSystemConfig', () => {
    it('should return core system config from cache', async () => {
      redis.get.mockResolvedValue(JSON.stringify(settingsData));
      const result = await coreSystemConfigService.getCoreSystemConfig(tenantId);
      expect(result).toEqual(settingsData);
      expect(CoreSystemConfig.findOne).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for core system config for tenant ${tenantId}`);
    });

    it('should return core system config from database and cache it', async () => {
      CoreSystemConfig.findOne.mockResolvedValue(settingsData);
      const result = await coreSystemConfigService.getCoreSystemConfig(tenantId);
      expect(result).toEqual(settingsData);
      expect(CoreSystemConfig.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`coreSystemConfig:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Core system config cached for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      CoreSystemConfig.findOne.mockResolvedValue(null);
      await expect(coreSystemConfigService.getCoreSystemConfig(tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('updateCoreSystemConfig', () => {
    it('should update core system config', async () => {
      const updateBody = { language: 'hi' };
      const updatedSettings = { ...settingsData, ...updateBody };
      CoreSystemConfig.findOne.mockResolvedValue({ ...settingsData, save: jest.fn().mockResolvedValue(updatedSettings) });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await coreSystemConfigService.updateCoreSystemConfig(updateBody, 'userId', tenantId, '127.0.0.1');
      expect(result).toEqual(updatedSettings);
      expect(CoreSystemConfig.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`coreSystemConfig:${tenantId}`, expect.any(String), 'EX', 300);
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'coreSystemConfig', action: 'update' }));
      expect(logger.info).toHaveBeenCalledWith(`Core system config updated for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      CoreSystemConfig.findOne.mockResolvedValue(null);
      await expect(coreSystemConfigService.updateCoreSystemConfig({ language: 'hi' }, 'userId', tenantId, '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('deleteCoreSystemConfig', () => {
    it('should soft delete core system config', async () => {
      CoreSystemConfig.findOne.mockResolvedValue({ ...settingsData, save: jest.fn().mockResolvedValue({ ...settingsData, isDeleted: true }) });
      SystemSettingsHistory.create.mockResolvedValue({});
      await coreSystemConfigService.deleteCoreSystemConfig(tenantId, 'userId', '127.0.0.1');
      expect(CoreSystemConfig.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.del).toHaveBeenCalledWith(`coreSystemConfig:${tenantId}`);
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith(expect.objectContaining({ module: 'coreSystemConfig', action: 'delete' }));
      expect(logger.info).toHaveBeenCalledWith(`Core system config deleted for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      CoreSystemConfig.findOne.mockResolvedValue(null);
      await expect(coreSystemConfigService.deleteCoreSystemConfig(tenantId, 'userId', '127.0.0.1')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('syncWithNTPServer', () => {
    it('should synchronize with NTP server', async () => {
      const settings = { ntpServer: 'pool.ntp.org', fallbackNtpServers: [], timeZone: 'UTC', dateTimeFormat: 'YYYY-MM-DD HH:mm:ss', tenantId };
      CoreSystemConfig.findOne.mockResolvedValue(settings);
      ntpClient.getNetworkTime.mockImplementation((server, port, callback) => callback(null, new Date('2025-07-31T12:00:00Z')));
      format.mockReturnValue('2025-07-31 12:00:00');
      const result = await coreSystemConfigService.syncWithNTPServer(tenantId);
      expect(result).toEqual({ success: true, time: '2025-07-31 12:00:00' });
      expect(ntpClient.getNetworkTime).toHaveBeenCalledWith('pool.ntp.org', 123, expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('NTP sync successful'));
    });

    it('should try fallback servers and throw error if all fail', async () => {
      const settings = { ntpServer: 'pool.ntp.org', fallbackNtpServers: ['time.google.com'], timeZone: 'UTC', dateTimeFormat: 'YYYY-MM-DD HH:mm:ss', tenantId };
      CoreSystemConfig.findOne.mockResolvedValue(settings);
      ntpClient.getNetworkTime.mockImplementation((server, port, callback) => callback(new Error('NTP failure'), null));
      await expect(coreSystemConfigService.syncWithNTPServer(tenantId)).rejects.toThrow(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'NTP synchronization failed with all servers')
      );
    });
  });

  describe('previewDateTimeFormat', () => {
    it('should preview date-time format', async () => {
      const formatString = 'YYYY-MM-DD HH:mm:ss';
      const locale = 'en-US';
      format.mockReturnValue('2025-07-31 12:00:00');
      parse.mockReturnValue(new Date());
      const result = await coreSystemConfigService.previewDateTimeFormat(formatString, locale);
      expect(result).toEqual({ formatted: '2025-07-31 12:00:00', parsed: expect.any(Date) });
      expect(format).toHaveBeenCalledWith(expect.any(Date), formatString, { locale: expect.any(Object) });
      expect(parse).toHaveBeenCalledWith('2025-07-31 12:00:00', formatString, expect.any(Date));
    });

    it('should throw error for invalid date-time format', async () => {
      const formatString = 'Invalid';
      const locale = 'en-US';
      format.mockImplementation(() => { throw new Error('Invalid format'); });
      await expect(coreSystemConfigService.previewDateTimeFormat(formatString, locale)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Invalid date-time format')
      );
    });
  });

  describe('getLanguagePack', () => {
    it('should return language pack from cache', async () => {
      const language = 'en';
      const languagePack = { welcome_message: 'Welcome to the System' };
      redis.get.mockResolvedValue(JSON.stringify(languagePack));
      const result = await coreSystemConfigService.getLanguagePack(language, tenantId);
      expect(result).toEqual(languagePack);
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for language pack: ${language} for tenant ${tenantId}`);
    });

    it('should load and cache language pack', async () => {
      const language = 'en';
      const languagePack = { welcome_message: 'Welcome to the System' };
      redis.get.mockResolvedValue(null);
      const result = await coreSystemConfigService.getLanguagePack(language, tenantId);
      expect(result).toEqual(languagePack);
      expect(redis.set).toHaveBeenCalledWith(`language:${language}:${tenantId}`, expect.any(String), 'EX', 3600);
      expect(logger.info).toHaveBeenCalledWith(`Language pack cached: ${language} for tenant ${tenantId}`);
    });
  });

  describe('translateText', () => {
    it('should return translation from cache', async () => {
      const text = 'Welcome to the System';
      const targetLanguage = 'hi';
      const translatedText = 'स्कूल ERP सिस्टम में आपका स्वागत है';
      redis.get.mockResolvedValue(JSON.stringify(translatedText));
      const result = await coreSystemConfigService.translateText(text, targetLanguage, tenantId);
      expect(result).toEqual(translatedText);
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for translation: ${text} to ${targetLanguage} for tenant ${tenantId}`);
    });

    it('should translate text and cache it', async () => {
      const text = 'Welcome to the System';
      const targetLanguage = 'hi';
      const translatedText = 'स्कूल ERP सिस्टम में आपका स्वागत है';
      redis.get.mockResolvedValue(null);
      const result = await coreSystemConfigService.translateText(text, targetLanguage, tenantId);
      expect(result).toEqual(translatedText);
      expect(redis.set).toHaveBeenCalledWith(`translation:${text}:${targetLanguage}:${tenantId}`, expect.any(String), 'EX', 3600);
      expect(logger.info).toHaveBeenCalledWith(`Translation cached: ${text} to ${targetLanguage} for tenant ${tenantId}`);
    });
  });

  describe('getRegionalDefaults', () => {
    it('should return regional defaults for US', async () => {
      const result = await coreSystemConfigService.getRegionalDefaults('8.8.8.8', tenantId);
      expect(result).toEqual(
        expect.objectContaining({
          timeZone: 'America/New_York',
          dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
          locale: 'en-US',
          language: 'en',
          numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
          addressFormat: { country: 'US' },
        })
      );
      expect(logger.info).toHaveBeenCalledWith(`Regional defaults retrieved for tenant ${tenantId}`);
    });

    it('should fallback to defaults for invalid values', async () => {
      const result = await coreSystemConfigService.getRegionalDefaults('invalid-ip', tenantId);
      expect(result).toEqual(
        expect.objectContaining({
          timeZone: 'UTC',
          dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
          locale: 'en-US',
          language: 'en',
          numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
          addressFormat: { country: 'US' },
        })
      );
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid time zone'));
    });
  });
});