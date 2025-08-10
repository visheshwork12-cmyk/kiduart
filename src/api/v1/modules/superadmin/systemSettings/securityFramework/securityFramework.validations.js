// src/api/v1/modules/superadmin/securityFramework/securityFramework.validations.js
import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const createSecurityFramework = {
  body: Joi.object().keys({
    authenticationStack: Joi.object({
      methods: Joi.array().items(Joi.string().valid(...CONSTANTS.AUTH_METHODS)).required(),
      email: Joi.object({
        enabled: Joi.boolean().required(),
        smtpServer: Joi.string().when('enabled', { is: true, then: Joi.required() }),
        smtpPort: Joi.number().when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
      sms: Joi.object({
        enabled: Joi.boolean().required(),
        provider: Joi.string().valid(...CONSTANTS.SMS_PROVIDERS).when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
      appBased: Joi.object({
        enabled: Joi.boolean().required(),
        secretLength: Joi.number().min(16).when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
    }).required(),
    encryption: Joi.object({
      standard: Joi.string().valid(...CONSTANTS.ENCRYPTION_STANDARDS).required(),
      keyRotationFrequency: Joi.number().min(1).required(),
    }).required(),
    ipGeofencing: Joi.object({
      enabled: Joi.boolean().required(),
      whitelist: Joi.array().items(Joi.string().ip()).optional(),
      blacklist: Joi.array().items(Joi.string().ip()).optional(),
      geoIpDatabase: Joi.string().valid(...CONSTANTS.GEOIP_DATABASES).required(),
    }).required(),
    sessionGovernance: Joi.object({
      idleTimeout: Joi.number().min(1).required(),
      concurrentLimit: Joi.number().min(1).required(),
    }).required(),
    complianceSuite: Joi.object({
      standards: Joi.array().items(Joi.string().valid(...CONSTANTS.COMPLIANCE_STANDARDS)).required(),
      auditLogs: Joi.object({
        enabled: Joi.boolean().required(),
        retentionPeriod: Joi.number().min(1).required(),
      }).required(),
      reportGeneration: Joi.object({
        enabled: Joi.boolean().required(),
        format: Joi.string().valid(...CONSTANTS.REPORT_FORMATS).required(),
      }).required(),
    }).required(),
    dataMasking: Joi.object({
      enabled: Joi.boolean().required(),
      fields: Joi.array().items(Joi.string().valid(...CONSTANTS.MASKABLE_FIELDS)).required(),
      policy: Joi.string().valid(...CONSTANTS.MASKING_POLICIES).required(),
    }).required(),
    tokenBlacklist: Joi.object({
      enabled: Joi.boolean().optional(),
      maxTokens: Joi.number().min(1).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
  }),
};

const getSecurityFramework = {
  query: Joi.object().keys({}),
};

const updateSecurityFramework = {
  body: Joi.object().keys({
    authenticationStack: Joi.object({
      methods: Joi.array().items(Joi.string().valid(...CONSTANTS.AUTH_METHODS)).optional(),
      email: Joi.object({
        enabled: Joi.boolean().optional(),
        smtpServer: Joi.string().when('enabled', { is: true, then: Joi.required() }),
        smtpPort: Joi.number().when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
      sms: Joi.object({
        enabled: Joi.boolean().optional(),
        provider: Joi.string().valid(...CONSTANTS.SMS_PROVIDERS).when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
      appBased: Joi.object({
        enabled: Joi.boolean().optional(),
        secretLength: Joi.number().min(16).when('enabled', { is: true, then: Joi.required() }),
      }).optional(),
    }).optional(),
    encryption: Joi.object({
      standard: Joi.string().valid(...CONSTANTS.ENCRYPTION_STANDARDS).optional(),
      keyRotationFrequency: Joi.number().min(1).optional(),
    }).optional(),
    ipGeofencing: Joi.object({
      enabled: Joi.boolean().optional(),
      whitelist: Joi.array().items(Joi.string().ip()).optional(),
      blacklist: Joi.array().items(Joi.string().ip()).optional(),
      geoIpDatabase: Joi.string().valid(...CONSTANTS.GEOIP_DATABASES).optional(),
    }).optional(),
    sessionGovernance: Joi.object({
      idleTimeout: Joi.number().min(1).optional(),
      concurrentLimit: Joi.number().min(1).optional(),
    }).optional(),
    complianceSuite: Joi.object({
      standards: Joi.array().items(Joi.string().valid(...CONSTANTS.COMPLIANCE_STANDARDS)).optional(),
      auditLogs: Joi.object({
        enabled: Joi.boolean().optional(),
        retentionPeriod: Joi.number().min(1).optional(),
      }).optional(),
      reportGeneration: Joi.object({
        enabled: Joi.boolean().optional(),
        format: Joi.string().valid(...CONSTANTS.REPORT_FORMATS).optional(),
      }).optional(),
    }).optional(),
    dataMasking: Joi.object({
      enabled: Joi.boolean().optional(),
      fields: Joi.array().items(Joi.string().valid(...CONSTANTS.MASKABLE_FIELDS)).optional(),
      policy: Joi.string().valid(...CONSTANTS.MASKING_POLICIES).optional(),
    }).optional(),
    tokenBlacklist: Joi.object({
      enabled: Joi.boolean().optional(),
      maxTokens: Joi.number().min(1).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
  }).min(1),
};

const deleteSecurityFramework = {
  query: Joi.object().keys({}),
};

const sendOTP = {
  body: Joi.object().keys({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+\d{10,15}$/).optional(),
  }).xor('email', 'phone'),
};

const verifyOTP = {
  body: Joi.object().keys({
    otp: Joi.string().length(6).required(),
    userId: Joi.string().required(),
  }),
};

const encryptData = {
  body: Joi.object().keys({
    data: Joi.string().required(),
  }),
};

const decryptData = {
  body: Joi.object().keys({
    encryptedData: Joi.string().required(),
    iv: Joi.string().required(),
    key: Joi.string().required(),
  }),
};

const checkIPGeofencing = {
  body: Joi.object().keys({
    ip: Joi.string().ip().required(),
  }),
};

const generateComplianceReport = {
  body: Joi.object().keys({}),
};

const maskData = {
  body: Joi.object().keys({
    data: Joi.string().required(),
    field: Joi.string().valid(...CONSTANTS.MASKABLE_FIELDS).required(),
  }),
};

const getSecurityStatus = {
  query: Joi.object().keys({}),
};

const rotateEncryptionKey = {
  body: Joi.object().keys({}),
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