import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';
import coreSystemConfigValidation from './coreSystemConfig.validations.js';
import coreSystemConfigRepository from '@repositories/systemSettings/coreSystemConfig.repository.js';
import { format, parse } from 'date-fns';
import ntpClient from 'ntp-client';

const createCoreSystemConfig = async (configData, userId, tenantId, ip) => {
  const { error } = coreSystemConfigValidation.createCoreSystemConfig.body.validate(configData);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }
  const existingConfig = await coreSystemConfigRepository.getCoreSystemConfig(tenantId);
  if (existingConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  }
  const config = await coreSystemConfigRepository.createCoreSystemConfig({ ...configData, tenantId });
  await SystemSettingsHistory.create({
    tenantId,
    module: 'coreSystemConfig',
    action: 'create',
    newValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:coreSystemConfig', JSON.stringify({ tenantId, action: 'create' }));
  logger.info(`Core system config created for tenant ${tenantId}`);
  return config;
};

const getCoreSystemConfig = async (tenantId) => {
  const config = await coreSystemConfigRepository.getCoreSystemConfig(tenantId);
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  return config;
};

const updateCoreSystemConfig = async (updateBody, userId, tenantId, ip) => {
  const { error } = coreSystemConfigValidation.updateCoreSystemConfig.body.validate(updateBody);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }
  const config = await coreSystemConfigRepository.updateCoreSystemConfig(updateBody, tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'coreSystemConfig',
    action: 'update',
    previousValue: config._previousDataValues,
    newValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:coreSystemConfig', JSON.stringify({ tenantId, action: 'update' }));
  logger.info(`Core system config updated for tenant ${tenantId}`);
  return config;
};

const deleteCoreSystemConfig = async (tenantId, userId, ip) => {
  const config = await coreSystemConfigRepository.getCoreSystemConfig(tenantId);
  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  await coreSystemConfigRepository.deleteCoreSystemConfig(tenantId);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'coreSystemConfig',
    action: 'delete',
    previousValue: config,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:coreSystemConfig', JSON.stringify({ tenantId, action: 'delete' }));
  logger.info(`Core system config deleted for tenant ${tenantId}`);
};

const syncWithNTPServer = async (tenantId) => {
  const settings = await coreSystemConfigRepository.getCoreSystemConfig(tenantId);
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  }
  const { ntpServer, fallbackNtpServers, timeZone, dateTimeFormat } = settings;
  let ntpTime;
  const servers = [ntpServer, ...fallbackNtpServers];
  for (const server of servers) {
    try {
      ntpTime = await new Promise((resolve, reject) => {
        ntpClient.getNetworkTime(server, 123, (err, date) => {
          if (err) reject(err);
          else resolve(date);
        });
      });
      break;
    } catch (error) {
      logger.warn(`NTP sync failed with ${server}: ${error.message}`);
    }
  }
  if (!ntpTime) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'NTP synchronization failed with all servers');
  }
  const formattedTime = format(ntpTime, dateTimeFormat, { timeZone });
  logger.info(`NTP sync successful with ${ntpServer}. Time: ${formattedTime}`);
  return { success: true, time: formattedTime };
};

const previewDateTimeFormat = async (formatString, locale) => {
  try {
    const date = new Date();
    const formatted = format(date, formatString, { locale: locale ? new Intl.Locale(locale) : undefined });
    return { formatted, parsed: parse(formatted, formatString, new Date()) };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date-time format');
  }
};

const getLanguagePack = async (language, tenantId) => {
  const cacheKey = `language:${language}:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for language pack: ${language} for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  // Placeholder for external translation service (e.g., AWS Translate, Google Translate)
  const languagePack = { welcome_message: `Welcome (${language})` }; // Replace with actual service call
  await redis.set(cacheKey, JSON.stringify(languagePack), 'EX', 3600);
  logger.info(`Language pack cached: ${language} for tenant ${tenantId}`);
  return languagePack;
};

const translateText = async (text, targetLanguage, tenantId) => {
  const cacheKey = `translation:${text}:${targetLanguage}:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for translation: ${text} to ${targetLanguage} for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  // Placeholder for external translation service (e.g., AWS Translate)
  const translatedText = targetLanguage === 'hi' ? 'स्कूल ERP सिस्टम में आपका स्वागत है' : text; // Replace with actual service call
  await redis.set(cacheKey, JSON.stringify(translatedText), 'EX', 3600);
  logger.info(`Translation cached: ${text} to ${targetLanguage} for tenant ${tenantId}`);
  return translatedText;
};

const getRegionalDefaults = async (ipAddress, tenantId) => {
  // Placeholder for external geo-IP service (e.g., MaxMind, IP2Location)
  const geoData = {
    timeZone: ipAddress === '8.8.8.8' ? 'America/New_York' : 'UTC',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    locale: 'en-US',
    language: 'en',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: { country: 'US' },
  };
  if (!CONSTANTS.TIME_ZONES.includes(geoData.timeZone)) {
    logger.warn(`Invalid time zone: ${geoData.timeZone}, defaulting to UTC`);
    geoData.timeZone = 'UTC';
  }
  logger.info(`Regional defaults retrieved for tenant ${tenantId}`);
  return geoData;
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