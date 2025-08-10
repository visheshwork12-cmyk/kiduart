import httpStatus from 'http-status';
import securityFrameworkService from './securityFramework.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogService from '@services/auditLog.service.js';

const createSecurityFramework = async (req, res, next) => {
  try {
    const settings = await securityFrameworkService.createSecurityFramework(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'securityFramework', tenantId: req.user.tenantId });
    await auditLogService.logAction('CREATE_SECURITY_FRAMEWORK', req.user.id, 'SecurityFramework', req.body, req.ip, req.user.tenantId);
    logger.info(`Security framework created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, settings, i18next.t('settings_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const getSecurityFramework = async (req, res, next) => {
  try {
    const settings = await securityFrameworkService.getSecurityFramework(req.user.tenantId);
    await auditLogService.logAction('GET_SECURITY_FRAMEWORK', req.user.id, 'SecurityFramework', {}, req.ip, req.user.tenantId);
    logger.info(`Security framework retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, settings, i18next.t('settings_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const updateSecurityFramework = async (req, res, next) => {
  try {
    const settings = await securityFrameworkService.updateSecurityFramework(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'securityFramework', tenantId: req.user.tenantId });
    await auditLogService.logAction('UPDATE_SECURITY_FRAMEWORK', req.user.id, 'SecurityFramework', req.body, req.ip, req.user.tenantId);
    logger.info(`Security framework updated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, settings, i18next.t('settings_updated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteSecurityFramework = async (req, res, next) => {
  try {
    await securityFrameworkService.deleteSecurityFramework(req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'securityFramework', tenantId: req.user.tenantId });
    await auditLogService.logAction('DELETE_SECURITY_FRAMEWORK', req.user.id, 'SecurityFramework', {}, req.ip, req.user.tenantId);
    logger.info(`Security framework deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('settings_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const sendOTP = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const result = email
      ? await securityFrameworkService.sendEmailOTP(email, req.user.id, req.user.tenantId, req.ip)
      : await securityFrameworkService.sendSMSOTP(phone, req.user.id, req.user.tenantId, req.ip);
    await auditLogService.logAction('SEND_OTP', req.user.id, 'SecurityFramework', { email, phone }, req.ip, req.user.tenantId);
    logger.info(`OTP sent for user ${req.user.id} via ${email ? 'email' : 'phone'}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('otp_sent'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.verifyOTP(req.body.otp, req.body.userId, req.user.tenantId, req.ip);
    await auditLogService.logAction('VERIFY_OTP', req.user.id, 'SecurityFramework', { otp: req.body.otp, userId: req.body.userId }, req.ip, req.user.tenantId);
    logger.info(`OTP verified for user ${req.body.userId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('otp_verified'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const encryptData = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.encryptData(req.body.data, req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('ENCRYPT_DATA', req.user.id, 'SecurityFramework', { dataLength: req.body.data.length }, req.ip, req.user.tenantId);
    logger.info(`Data encrypted for user ${req.user.id}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('data_encrypted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const decryptData = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.decryptData(req.body.encryptedData, req.body.iv, req.body.key, req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('DECRYPT_DATA', req.user.id, 'SecurityFramework', { encryptedDataLength: req.body.encryptedData.length }, req.ip, req.user.tenantId);
    logger.info(`Data decrypted for user ${req.user.id}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('data_decrypted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const checkIPGeofencing = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.checkIPGeofencing(req.body.ip, req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('CHECK_IP_GEOFENCING', req.user.id, 'SecurityFramework', { ip: req.body.ip }, req.ip, req.user.tenantId);
    logger.info(`IP geofencing checked for IP ${req.body.ip} by user ${req.user.id}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('ip_check_completed'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const generateComplianceReport = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.generateComplianceReport(req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('GENERATE_COMPLIANCE_REPORT', req.user.id, 'SecurityFramework', {}, req.ip, req.user.tenantId);
    logger.info(`Compliance report generated by user ${req.user.id}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('compliance_report_generated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const maskData = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.maskData(req.body.data, req.body.field, req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('MASK_DATA', req.user.id, 'SecurityFramework', { field: req.body.field }, req.ip, req.user.tenantId);
    logger.info(`Data masked for field ${req.body.field} by user ${req.user.id}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('data_masked'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getSecurityStatus = async (req, res, next) => {
  try {
    const status = await securityFrameworkService.getSecurityStatus(req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('GET_SECURITY_STATUS', req.user.id, 'SecurityFramework', {}, req.ip, req.user.tenantId);
    logger.info(`Security status retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, status, i18next.t('security_status_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const rotateEncryptionKey = async (req, res, next) => {
  try {
    const result = await securityFrameworkService.rotateEncryptionKey(req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'securityFramework', tenantId: req.user.tenantId });
    await auditLogService.logAction('ROTATE_ENCRYPTION_KEY', req.user.id, 'SecurityFramework', {}, req.ip, req.user.tenantId);
    logger.info(`Encryption key rotated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('key_rotated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createSecurityFramework,
  getSecurityFramework,
  updateSecurityFramework,
  deleteSecurityFramework,
  sendOTP,
  verifyOTP,
  encryptData,
  decryptData,
  checkIPGeofencing,
  generateComplianceReport,
  maskData,
  getSecurityStatus,
  rotateEncryptionKey,
};