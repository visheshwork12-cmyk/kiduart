import securityFrameworkService from '@api/v1/modules/superadmin/systemSettings/securityFramework/securityFramework.service.js';
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import FeatureFlags from '@models/superadmin/featureFlag.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@constants/index.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import mongoose from 'mongoose';

jest.mock('@models/superadmin/securityFramework.model.js');
jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@models/superadmin/featureFlag.model.js');
jest.mock('@lib/redis.js');
jest.mock('nodemailer');
jest.mock('twilio');
jest.mock('otplib');
jest.mock('crypto');
jest.mock('geoip-lite');
jest.mock('@config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('SecurityFramework Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const ip = '127.0.0.1';

  const settingsData = {
    authenticationStack: {
      methods: ['Email OTP', 'SMS OTP'],
      email: { enabled: true, smtpServer: 'smtp.example.com', smtpPort: 587 },
      sms: { enabled: true, provider: 'Twilio' },
      appBased: { enabled: false },
    },
    encryption: { standard: 'AES-256', keyRotationFrequency: 90, currentKeyId: 'key1' },
    ipGeofencing: { enabled: true, whitelist: ['192.168.1.1'], blacklist: [], geoIpDatabase: 'GeoLite2' },
    sessionGovernance: { idleTimeout: 15, concurrentLimit: 5 },
    complianceSuite: {
      standards: ['ISO 27001', 'GDPR'],
      auditLogs: { enabled: true, retentionPeriod: 365 },
      reportGeneration: { enabled: true, format: 'PDF' },
    },
    dataMasking: { enabled: true, fields: ['Aadhaar', 'Phone', 'Email', 'Name'], policy: 'Partial' },
    tokenBlacklist: { enabled: true, maxTokens: 1000 },
    tenantId,
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
    FeatureFlags.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        tenantId,
        flags: [
          { name: 'multi_factor_auth', enabled: true },
          { name: 'compliance_reports', enabled: true },
          { name: 'data_masking', enabled: true },
        ],
      }),
    });
  });

  describe('createSecurityFramework', () => {
    it('should create security framework config', async () => {
      SecurityFramework.findOne.mockResolvedValue(null);
      SecurityFramework.create.mockResolvedValue(settingsData);
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await securityFrameworkService.createSecurityFramework(settingsData, userId, tenantId, ip);
      expect(result).toEqual(settingsData);
      expect(SecurityFramework.create).toHaveBeenCalledWith({ ...settingsData, tenantId });
      expect(SystemSettingsHistory.create).toHaveBeenCalledWith({
        tenantId,
        module: 'securityFramework',
        action: 'create',
        newValue: settingsData,
        changedBy: userId,
        ipAddress: ip,
      });
      expect(redis.set).toHaveBeenCalledWith(`securityFramework:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Security framework created for tenant ${tenantId}`);
    });

    it('should throw error if settings already exist', async () => {
      SecurityFramework.findOne.mockResolvedValue(settingsData);
      await expect(securityFrameworkService.createSecurityFramework(settingsData, userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS)
      );
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid settings', async () => {
      const invalidSettings = { ...settingsData, encryption: { standard: 'INVALID' } };
      await expect(securityFrameworkService.createSecurityFramework(invalidSettings, userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });
  });

  describe('getSecurityFramework', () => {
    it('should return security framework config from cache', async () => {
      redis.get.mockResolvedValue(JSON.stringify(settingsData));
      const result = await securityFrameworkService.getSecurityFramework(tenantId);
      expect(result).toEqual(settingsData);
      expect(SecurityFramework.findOne).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for security framework for tenant ${tenantId}`);
    });

    it('should return security framework config from database', async () => {
      redis.get.mockResolvedValue(null);
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.getSecurityFramework(tenantId);
      expect(result).toEqual(settingsData);
      expect(SecurityFramework.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`securityFramework:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Security framework cached for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      redis.get.mockResolvedValue(null);
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(securityFrameworkService.getSecurityFramework(tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('updateSecurityFramework', () => {
    it('should update security framework config', async () => {
      const updateBody = { encryption: { standard: 'RSA-2048' } };
      const updatedSettings = { ...settingsData, ...updateBody };
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
        save: jest.fn().mockResolvedValue(updatedSettings),
      });
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await securityFrameworkService.updateSecurityFramework(updateBody, userId, tenantId, ip);
      expect(result).toEqual(updatedSettings);
      expect(SecurityFramework.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.set).toHaveBeenCalledWith(`securityFramework:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Security framework cache updated for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(securityFrameworkService.updateSecurityFramework({ encryption: { standard: 'RSA-2048' } }, userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });

    it('should throw validation error for invalid update', async () => {
      const invalidUpdate = { encryption: { standard: 'INVALID' } };
      await expect(securityFrameworkService.updateSecurityFramework(invalidUpdate, userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });
  });

  describe('deleteSecurityFramework', () => {
    it('should soft delete security framework config', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
        save: jest.fn().mockResolvedValue({ ...settingsData, isDeleted: true }),
      });
      SystemSettingsHistory.create.mockResolvedValue({});
      await securityFrameworkService.deleteSecurityFramework(tenantId, userId, ip);
      expect(SecurityFramework.findOne).toHaveBeenCalledWith({ tenantId, isDeleted: false });
      expect(redis.del).toHaveBeenCalledWith(`securityFramework:${tenantId}`);
      expect(logger.info).toHaveBeenCalledWith(`Security framework deleted for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(securityFrameworkService.deleteSecurityFramework(tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('sendEmailOTP', () => {
    it('should send email OTP', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const transporter = { sendMail: jest.fn().mockResolvedValue({}) };
      nodemailer.createTransport.mockReturnValue(transporter);
      authenticator.generateSecret.mockReturnValue('secret');
      authenticator.generate.mockReturnValue('123456');
      const result = await securityFrameworkService.sendEmailOTP('test@xai.com', userId, tenantId, ip);
      expect(result).toEqual({ success: true, message: 'otp_sent_email' });
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
      });
      expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@xai.com',
        subject: 'Your OTP for XAI Platform',
        text: expect.stringContaining('Your OTP is 123456'),
      }));
      expect(redis.set).toHaveBeenCalledWith(`otp:${tenantId}:${userId}`, '123456', 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Email OTP sent to test@xai.com for tenant ${tenantId}`);
    });

    it('should throw error if email OTP is not enabled', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...settingsData, authenticationStack: { ...settingsData.authenticationStack, email: { enabled: false } } }),
      });
      await expect(securityFrameworkService.sendEmailOTP('test@xai.com', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email OTP is not enabled')
      );
    });

    it('should throw error for too many OTP requests', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      redis.get.mockResolvedValue('3');
      await expect(securityFrameworkService.sendEmailOTP('test@xai.com', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many OTP requests')
      );
    });
  });

  describe('sendSMSOTP', () => {
    it('should send SMS OTP', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const twilioClient = { messages: { create: jest.fn().mockResolvedValue({}) } };
      twilio.mockReturnValue(twilioClient);
      authenticator.generateSecret.mockReturnValue('secret');
      authenticator.generate.mockReturnValue('123456');
      const result = await securityFrameworkService.sendSMSOTP('+1234567890', userId, tenantId, ip);
      expect(result).toEqual({ success: true, message: 'otp_sent_phone' });
      expect(twilioClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.stringContaining('Your OTP is 123456'),
        to: '+1234567890',
      }));
      expect(redis.set).toHaveBeenCalledWith(`otp:${tenantId}:${userId}`, '123456', 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`SMS OTP sent to +1234567890 for tenant ${tenantId}`);
    });

    it('should throw error if SMS OTP is not enabled', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      await expect(securityFrameworkService.sendSMSOTP('+1234567890', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'SMS OTP is not enabled')
      );
    });

    it('should throw error for too many OTP requests', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      redis.get.mockResolvedValue('3');
      await expect(securityFrameworkService.sendSMSOTP('+1234567890', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many OTP requests')
      );
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP', async () => {
      redis.get.mockResolvedValue('123456');
      const result = await securityFrameworkService.verifyOTP('123456', userId, tenantId, ip);
      expect(result).toEqual({ success: true, message: 'otp_verified' });
      expect(redis.get).toHaveBeenCalledWith(`otp:${tenantId}:${userId}`);
      expect(redis.del).toHaveBeenCalledWith(`otp:${tenantId}:${userId}`);
      expect(logger.info).toHaveBeenCalledWith(`OTP verified for user ${userId} in tenant ${tenantId}`);
    });

    it('should throw error for invalid OTP', async () => {
      redis.get.mockResolvedValue('123456');
      await expect(securityFrameworkService.verifyOTP('654321', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.INVALID_OTP)
      );
    });

    it('should throw error if OTP not found', async () => {
      redis.get.mockResolvedValue(null);
      await expect(securityFrameworkService.verifyOTP('123456', userId, tenantId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.INVALID_OTP)
      );
    });
  });

  describe('encryptData', () => {
    it('should encrypt data', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      crypto.randomBytes
        .mockReturnValueOnce(Buffer.from('key123', 'hex'))
        .mockReturnValueOnce(Buffer.from('iv123', 'hex'));
      const cipher = {
        update: jest.fn().mockReturnValue('encrypted'),
        final: jest.fn().mockReturnValue(''),
      };
      crypto.createCipheriv.mockReturnValue(cipher);
      const result = await securityFrameworkService.encryptData('test data', tenantId, userId, ip);
      expect(result).toEqual({ encryptedData: 'encrypted', iv: 'iv123', key: 'key123' });
      expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-cbc', Buffer.from('key123', 'hex'), Buffer.from('iv123', 'hex'));
      expect(cipher.update).toHaveBeenCalledWith('test data', 'utf8', 'hex');
      expect(logger.info).toHaveBeenCalledWith(`Data encrypted for tenant ${tenantId}`);
    });

    it('should throw validation error for empty data', async () => {
      await expect(securityFrameworkService.encryptData('', tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });
  });

  describe('decryptData', () => {
    it('should decrypt data', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const decipher = {
        update: jest.fn().mockReturnValue('decrypted'),
        final: jest.fn().mockReturnValue(''),
      };
      crypto.createDecipheriv.mockReturnValue(decipher);
      const result = await securityFrameworkService.decryptData('encrypted', 'iv123', 'key123', tenantId, userId, ip);
      expect(result).toEqual('decrypted');
      expect(crypto.createDecipheriv).toHaveBeenCalledWith('aes-256-cbc', Buffer.from('key123', 'hex'), Buffer.from('iv123', 'hex'));
      expect(decipher.update).toHaveBeenCalledWith('encrypted', 'hex', 'utf8');
      expect(logger.info).toHaveBeenCalledWith(`Data decrypted for tenant ${tenantId}`);
    });

    it('should throw validation error for invalid input', async () => {
      await expect(securityFrameworkService.decryptData('', 'iv123', 'key123', tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, expect.any(String))
      );
    });
  });

  describe('checkIPGeofencing', () => {
    it('should allow IP if geofencing is disabled', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...settingsData, ipGeofencing: { enabled: false } }),
      });
      const result = await securityFrameworkService.checkIPGeofencing('192.168.1.2', tenantId, userId, ip);
      expect(result).toEqual({ allowed: true, message: 'Geofencing disabled' });
    });

    it('should allow whitelisted IP', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.checkIPGeofencing('192.168.1.1', tenantId, userId, ip);
      expect(result).toEqual({ allowed: true, message: 'IP is whitelisted' });
    });

    it('should block blacklisted IP', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...settingsData, ipGeofencing: { ...settingsData.ipGeofencing, blacklist: ['192.168.1.2'] } }),
      });
      const result = await securityFrameworkService.checkIPGeofencing('192.168.1.2', tenantId, userId, ip);
      expect(result).toEqual({ allowed: false, reason: 'IP is blacklisted' });
    });

    it('should block invalid IP', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      geoip.lookup.mockReturnValue(null);
      const result = await securityFrameworkService.checkIPGeofencing('192.168.1.2', tenantId, userId, ip);
      expect(result).toEqual({ allowed: false, reason: 'Invalid IP or geo-IP database' });
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.generateComplianceReport(tenantId, userId, ip);
      expect(result).toMatchObject({
        success: true,
        report: {
          tenantId,
          standards: ['ISO 27001', 'GDPR'],
          auditLogs: 'Logs retained for 365 days',
          encryption: 'AES-256',
        },
        message: 'compliance_report_generated',
      });
      expect(logger.info).toHaveBeenCalledWith(`Compliance report generated for tenant ${tenantId}`);
    });

    it('should throw error if report generation is disabled', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...settingsData,
          complianceSuite: { ...settingsData.complianceSuite, reportGeneration: { enabled: false, format: 'PDF' } },
        }),
      });
      await expect(securityFrameworkService.generateComplianceReport(tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Compliance report generation is not enabled')
      );
    });
  });

  describe('maskData', () => {
    it('should mask Aadhaar data', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.maskData('1234-5678-9012', 'Aadhaar', tenantId, userId, ip);
      expect(result).toEqual('XXXX-XXXX-9012');
    });

    it('should fully mask data with Full policy', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...settingsData, dataMasking: { ...settingsData.dataMasking, policy: 'Full' } }),
      });
      const result = await securityFrameworkService.maskData('1234-5678-9012', 'Aadhaar', tenantId, userId, ip);
      expect(result).toEqual('****');
    });

    it('should return unmasked data if masking is disabled', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...settingsData, dataMasking: { ...settingsData.dataMasking, enabled: false } }),
      });
      const result = await securityFrameworkService.maskData('1234-5678-9012', 'Aadhaar', tenantId, userId, ip);
      expect(result).toEqual('1234-5678-9012');
    });

    it('should handle empty data', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.maskData('', 'Aadhaar', tenantId, userId, ip);
      expect(result).toEqual('');
    });
  });

  describe('getSecurityStatus', () => {
    it('should retrieve security status', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(settingsData),
      });
      const result = await securityFrameworkService.getSecurityStatus(tenantId, userId, ip);
      expect(result).toMatchObject({
        authentication: 'Configured',
        encryption: 'Active',
        ipGeofencing: 'Enabled',
        compliance: 'Compliant',
        dataMasking: 'Enabled',
      });
      expect(logger.info).toHaveBeenCalledWith(`Security status retrieved for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(securityFrameworkService.getSecurityStatus(tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });

  describe('rotateEncryptionKey', () => {
    it('should rotate encryption key', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...settingsData,
          save: jest.fn().mockResolvedValue({ ...settingsData, encryption: { ...settingsData.encryption, currentKeyId: 'key2' } }),
        }),
      });
      SystemSettingsHistory.create.mockResolvedValue({});
      crypto.randomUUID.mockReturnValue('key2');
      const result = await securityFrameworkService.rotateEncryptionKey(tenantId, userId, ip);
      expect(result).toEqual({ success: true, message: 'key_rotated' });
      expect(redis.set).toHaveBeenCalledWith(`securityFramework:${tenantId}`, expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Encryption key rotated for tenant ${tenantId}`);
    });

    it('should throw error if settings not found', async () => {
      SecurityFramework.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(securityFrameworkService.rotateEncryptionKey(tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND)
      );
    });
  });
});