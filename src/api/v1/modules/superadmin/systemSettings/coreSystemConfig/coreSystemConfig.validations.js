import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const createCoreSystemConfig = {
  body: Joi.object().keys({
    systemIdentifier: Joi.string().required().messages({
      'string.base': 'System identifier must be a string',
      'any.required': 'System identifier is required',
    }),
    version: Joi.string().required().messages({
      'string.base': 'Version must be a string',
      'any.required': 'Version is required',
    }),
    operationalMode: Joi.string().valid(...CONSTANTS.OPERATIONAL_MODES).required().messages({
      'string.base': 'Operational mode must be a string',
      'any.required': 'Operational mode is required',
      'any.only': `Operational mode must be one of ${CONSTANTS.OPERATIONAL_MODES.join(', ')}`,
    }),
    sandboxMode: Joi.boolean().optional(),
    ntpServer: Joi.string().trim().optional().messages({
      'string.base': 'NTP server must be a string',
    }),
    fallbackNtpServers: Joi.array().items(Joi.string().trim()).optional(),
    syncInterval: Joi.number().min(1).optional().messages({
      'number.base': 'Sync interval must be a number',
      'number.min': 'Sync interval must be at least 1',
    }),
    timeZone: Joi.string().valid(...CONSTANTS.TIME_ZONES).required().messages({
      'string.base': 'Time zone must be a string',
      'any.required': 'Time zone is required',
    }),
    dateTimeFormat: Joi.string().trim().optional().messages({
      'string.base': 'Date-time format must be a string',
    }),
    locale: Joi.string().trim().optional().messages({
      'string.base': 'Locale must be a string',
    }),
    language: Joi.string().trim().optional().messages({
      'string.base': 'Language must be a string',
    }),
    numberFormat: Joi.object({
      decimalSeparator: Joi.string().trim().optional(),
      thousandsSeparator: Joi.string().trim().optional(),
    }).optional(),
    addressFormat: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      postalCode: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
    }).optional(),
    cache: Joi.object({
      enabled: Joi.boolean().required(),
      host: Joi.string().when('enabled', { is: true, then: Joi.required() }),
      port: Joi.number().when('enabled', { is: true, then: Joi.required() }),
      ttl: Joi.number().min(60).when('enabled', { is: true, then: Joi.required() }),
    }).required(),
    encryptionSettings: Joi.object({
      enabled: Joi.boolean().optional(),
      algorithm: Joi.string().valid('AES-256', 'RSA').when('enabled', { is: true, then: Joi.required() }),
      keyRotationInterval: Joi.number().min(1).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
  }),
};

const getCoreSystemConfig = {
  query: Joi.object().keys({}),
};

const updateCoreSystemConfig = {
  body: Joi.object().keys({
    systemIdentifier: Joi.string().optional().messages({
      'string.base': 'System identifier must be a string',
    }),
    version: Joi.string().optional().messages({
      'string.base': 'Version must be a string',
    }),
    operationalMode: Joi.string().valid(...CONSTANTS.OPERATIONAL_MODES).optional().messages({
      'string.base': 'Operational mode must be a string',
      'any.only': `Operational mode must be one of ${CONSTANTS.OPERATIONAL_MODES.join(', ')}`,
    }),
    sandboxMode: Joi.boolean().optional(),
    ntpServer: Joi.string().trim().optional().messages({
      'string.base': 'NTP server must be a string',
    }),
    fallbackNtpServers: Joi.array().items(Joi.string().trim()).optional(),
    syncInterval: Joi.number().min(1).optional().messages({
      'number.base': 'Sync interval must be a number',
      'number.min': 'Sync interval must be at least 1',
    }),
    timeZone: Joi.string().valid(...CONSTANTS.TIME_ZONES).optional().messages({
      'string.base': 'Time zone must be a string',
    }),
    dateTimeFormat: Joi.string().trim().optional().messages({
      'string.base': 'Date-time format must be a string',
    }),
    locale: Joi.string().trim().optional().messages({
      'string.base': 'Locale must be a string',
    }),
    language: Joi.string().trim().optional().messages({
      'string.base': 'Language must be a string',
    }),
    numberFormat: Joi.object({
      decimalSeparator: Joi.string().trim().optional(),
      thousandsSeparator: Joi.string().trim().optional(),
    }).optional(),
    addressFormat: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      postalCode: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
    }).optional(),
    cache: Joi.object({
      enabled: Joi.boolean().optional(),
      host: Joi.string().when('enabled', { is: true, then: Joi.required() }),
      port: Joi.number().when('enabled', { is: true, then: Joi.required() }),
      ttl: Joi.number().min(60).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
    encryptionSettings: Joi.object({
      enabled: Joi.boolean().optional(),
      algorithm: Joi.string().valid('AES-256', 'RSA').when('enabled', { is: true, then: Joi.required() }),
      keyRotationInterval: Joi.number().min(1).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
  }).min(1),
};

const deleteCoreSystemConfig = {
  query: Joi.object().keys({}),
};

const syncWithNTPServer = {
  body: Joi.object().keys({}),
};

const previewDateTimeFormat = {
  body: Joi.object().keys({
    format: Joi.string().required().messages({
      'string.base': 'Format must be a string',
      'any.required': 'Format is required',
    }),
    locale: Joi.string().optional().messages({
      'string.base': 'Locale must be a string',
    }),
  }),
};

const getLanguagePack = {
  params: Joi.object().keys({
    language: Joi.string().required().messages({
      'string.base': 'Language must be a string',
      'any.required': 'Language is required',
    }),
  }),
};

const translateText = {
  body: Joi.object().keys({
    text: Joi.string().required().messages({
      'string.base': 'Text must be a string',
      'any.required': 'Text is required',
    }),
    targetLanguage: Joi.string().required().messages({
      'string.base': 'Target language must be a string',
      'any.required': 'Target language is required',
    }),
  }),
};

const getRegionalDefaults = {
  query: Joi.object().keys({
    ipAddress: Joi.string().optional().messages({
      'string.base': 'IP address must be a string',
    }),
  }),
};

export default {
  createCoreSystemConfig,
  getCoreSystemConfig,
  updateCoreSystemConfig,
  deleteCoreSystemConfig,
  syncWithNTPServer,
  previewDateTimeFormat,
  getLanguagePack,
  translateText,
  getRegionalDefaults,
};