import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import FeatureFlags from '@models/superadmin/featureFlag.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import securityFrameworkValidation from './securityFramework.validations.js';
import securityFrameworkRepository from '@repositories/systemSettings/securityFramework.repository.js';
import { complianceHealthGauge } from '@utils/metrics.js';

const createSecurityFramework = async (settingsData, userId, tenantId, ip) => {
  const { error } = securityFrameworkValidation.createSecurityFramework.body.validate(settingsData);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const existingSettings = await securityFrameworkRepository.getSecurityFramework(tenantId);
  if (existingSettings) throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  const settings = await securityFrameworkRepository.createSecurityFramework({ ...settingsData, tenantId });
  await SystemSettingsHistory.create({
    tenantId,
    module: 'securityFramework',
    action: 'create',
    newValue: settings,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:securityFramework', JSON.stringify({ tenantId, action: 'create' }));
  complianceHealthGauge.set({ tenantId }, settings.complianceSuite.standards.length > 0 ? 1 : 0);
  logger.info(`Security framework created for tenant ${tenantId}`);
  return settings;
};

const getSecurityFramework = async (tenantId) => {
  const settings = await securityFrameworkRepository.getSecurityFramework(tenantId);
  if (!settings) throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  return settings;
};

const updateSecurityFramework = async (updateBody, userId, tenantId, ip) => {
  const { error } = securityFrameworkValidation.updateSecurityFramework.body.validate(updateBody);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await securityFrameworkRepository.updateSecurityFramework(updateBody, tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'securityFramework',
    action: 'update',
    previousValue: settings._previousDataValues,
    newValue: settings,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:securityFramework', JSON.stringify({ tenantId, action: 'update' }));
  complianceHealthGauge.set({ tenantId }, settings.complianceSuite.standards.length > 0 ? 1 : 0);
  logger.info(`Security framework updated for tenant ${tenantId}`);
  return settings;
};

const deleteSecurityFramework = async (tenantId, userId, ip) => {
  const settings = await securityFrameworkRepository.getSecurityFramework(tenantId);
  if (!settings) throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  await securityFrameworkRepository.deleteSecurityFramework(tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'securityFramework',
    action: 'delete',
    previousValue: settings,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:securityFramework', JSON.stringify({ tenantId, action: 'delete' }));
  logger.info(`Security framework deleted for tenant ${tenantId}`);
};

const sendEmailOTP = async (email, userId, tenantId, ip) => {
  const { error } = securityFrameworkValidation.sendOTP.body.validate({ email });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await getSecurityFramework(tenantId);
  const flags = await FeatureFlags.findOne({ tenantId });
  if (!flags?.flags.find(f => f.name === 'multi_factor_auth' && f.enabled)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Multi-factor authentication is disabled');
  }
  if (!settings.authenticationStack.email.enabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email OTP is not enabled');
  }
  const rateLimitKey = `otp:rate:${tenantId}:${userId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 3) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many OTP requests');
  }
  const otp = authenticator.generate(authenticator.generateSecret());
  const transporter = nodemailer.createTransport({
    host: settings.authenticationStack.email.smtpServer,
    port: settings.authenticationStack.email.smtpPort,
    secure: settings.authenticationStack.email.smtpPort === 465,
  });
  await transporter.sendMail({
    from: 'no-reply@xai.com',
    to: email,
    subject: 'Your OTP for XAI Platform',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });
  await redis.set(`otp:${tenantId}:${userId}`, otp, 'EX', 300);
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  logger.info(`Email OTP sent to ${email} for tenant ${tenantId}`);
  return { success: true, message: i18next.t('otp_sent_email') };
};

const sendSMSOTP = async (phone, userId, tenantId, ip) => {
  const { error } = securityFrameworkValidation.sendOTP.body.validate({ phone });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await getSecurityFramework(tenantId);
  const flags = await FeatureFlags.findOne({ tenantId });
  if (!flags?.flags.find(f => f.name === 'multi_factor_auth' && f.enabled)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Multi-factor authentication is disabled');
  }
  if (!settings.authenticationStack.sms.enabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SMS OTP is not enabled');
  }
  const rateLimitKey = `otp:rate:${tenantId}:${userId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 3) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many OTP requests');
  }
  const otp = authenticator.generate(authenticator.generateSecret());
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your OTP is ${otp}. It expires in 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  await redis.set(`otp:${tenantId}:${userId}`, otp, 'EX', 300);
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  logger.info(`SMS OTP sent to ${phone} for tenant ${tenantId}`);
  return { success: true, message: i18next.t('otp_sent_phone') };
};

const verifyOTP = async (otp, userId, tenantId, ip) => {
  const { error } = securityFrameworkValidation.verifyOTP.body.validate({ otp, userId });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const storedOTP = await redis.get(`otp:${tenantId}:${userId}`);
  if (!storedOTP || storedOTP !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.INVALID_OTP);
  }
  await redis.del(`otp:${tenantId}:${userId}`);
  logger.info(`OTP verified for user ${userId} in tenant ${tenantId}`);
  return { success: true, message: i18next.t('otp_verified') };
};

const encryptData = async (data, tenantId, userId, ip) => {
  const { error } = securityFrameworkValidation.encryptData.body.validate({ data });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await getSecurityFramework(tenantId);
  // In production, retrieve key from secure storage (e.g., AWS KMS)
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(settings.encryption.standard.toLowerCase() || 'aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  logger.info(`Data encrypted for tenant ${tenantId}`);
  return { encryptedData: encrypted, iv: iv.toString('hex'), key: key.toString('hex') };
};

const decryptData = async (encryptedData, iv, key, tenantId, userId, ip) => {
  const { error } = securityFrameworkValidation.decryptData.body.validate({ encryptedData, iv, key });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await getSecurityFramework(tenantId);
  const decipher = crypto.createDecipheriv(settings.encryption.standard.toLowerCase() || 'aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  logger.info(`Data decrypted for tenant ${tenantId}`);
  return decrypted;
};

const checkIPGeofencing = async (ip, tenantId, userId, ipAddress) => {
  const { error } = securityFrameworkValidation.checkIPGeofencing.body.validate({ ip });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const settings = await getSecurityFramework(tenantId);
  if (!settings.ipGeofencing.enabled) {
    return { allowed: true, message: 'Geofencing disabled' };
  }
  if (settings.ipGeofencing.whitelist.includes(ip)) {
    return { allowed: true, message: 'IP is whitelisted' };
  }
  if (settings.ipGeofencing.blacklist.includes(ip)) {
    return { allowed: false, reason: 'IP is blacklisted' };
  }
  const geo = geoip.lookup(ip);
  if (!geo || !settings.ipGeofencing.geoIpDatabase) {
    return { allowed: false, reason: 'Invalid IP or geo-IP database' };
  }
  logger.info(`IP geofencing checked for IP ${ip} in tenant ${tenantId}`);
  return { allowed: true, message: 'IP allowed by geo-IP check' };
};

const generateComplianceReport = async (tenantId, userId, ip) => {
  const settings = await getSecurityFramework(tenantId);
  const flags = await FeatureFlags.findOne({ tenantId });
  if (!flags?.flags.find(f => f.name === 'compliance_reports' && f.enabled)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Compliance reports are disabled');
  }
  if (!settings.complianceSuite.reportGeneration.enabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Compliance report generation is not enabled');
  }
  const report = {
    tenantId,
    standards: settings.complianceSuite.standards,
    auditLogs: settings.complianceSuite.auditLogs.enabled ? `Logs retained for ${settings.complianceSuite.auditLogs.retentionPeriod} days` : 'Logs disabled',
    encryption: settings.encryption.standard,
    timestamp: new Date().toISOString(),
  };
  logger.info(`Compliance report generated for tenant ${tenantId}`);
  return { success: true, report, message: i18next.t('compliance_report_generated') };
};

const maskData = async (data, field, tenantId, userId, ip) => {
  const { error } = securityFrameworkValidation.maskData.body.validate({ data, field });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  if (!data) return '';
  const settings = await getSecurityFramework(tenantId);
  const flags = await FeatureFlags.findOne({ tenantId });
  if (!flags?.flags.find(f => f.name === 'data_masking' && f.enabled)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Data masking is disabled');
  }
  if (!settings.dataMasking.enabled || !settings.dataMasking.fields.includes(field)) {
    return data;
  }
  if (settings.dataMasking.policy === 'Full') {
    return '****';
  }
  switch (field.toLowerCase()) {
    case 'aadhaar':
      return data.length >= 4 ? `XXXX-XXXX-${data.slice(-4)}` : '****';
    case 'phone':
      return data.length >= 4 ? `XXXX-XXX-${data.slice(-4)}` : '****';
    case 'email':
      const [local, domain] = data.split('@');
      return local && domain ? `${local.slice(0, 2)}****@${domain}` : '****';
    case 'name':
      return data.length >= 2 ? `${data[0]}****${data.slice(-1)}` : '****';
    default:
      return data;
  }
};

const getSecurityStatus = async (tenantId, userId, ip) => {
  const settings = await getSecurityFramework(tenantId);
  const status = {
    authentication: settings.authenticationStack.methods.length > 0 ? 'Configured' : 'Not Configured',
    encryption: settings.encryption.standard ? 'Active' : 'Not Configured',
    ipGeofencing: settings.ipGeofencing.enabled ? 'Enabled' : 'Disabled',
    compliance: settings.complianceSuite.standards.length > 0 ? 'Compliant' : 'Non-Compliant',
    dataMasking: settings.dataMasking.enabled ? 'Enabled' : 'Disabled',
    lastUpdated: settings.updatedAt,
  };
  logger.info(`Security status retrieved for tenant ${tenantId}`);
  return status;
};

const rotateEncryptionKey = async (tenantId, userId, ip) => {
  const settings = await getSecurityFramework(tenantId);
  settings.encryption.currentKeyId = crypto.randomUUID();
  await settings.save();
  await redis.set(`securityFramework:${tenantId}`, JSON.stringify(settings), 'EX', 300);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'securityFramework',
    action: 'key_rotation',
    previousValue: { keyId: settings._previousDataValues.encryption.currentKeyId },
    newValue: { keyId: settings.encryption.currentKeyId },
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:securityFramework', JSON.stringify({ tenantId, action: 'key_rotation' }));
  logger.info(`Encryption key rotated for tenant ${tenantId}`);
  return { success: true, message: i18next.t('key_rotated') };
};

export default {
  createSecurityFramework,
  getSecurityFramework,
  updateSecurityFramework,
  deleteSecurityFramework,
  sendEmailOTP,
  sendSMSOTP,
  verifyOTP,
  encryptData,
  decryptData,
  checkIPGeofencing,
  generateComplianceReport,
  maskData,
  getSecurityStatus,
  rotateEncryptionKey,
};