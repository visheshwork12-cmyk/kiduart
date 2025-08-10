import SystemSettingsModel from '@models/superadmin/systemSettings.model.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@config/constants.js';
import { getRedisClient } from '@lib/redis.js';
import logger from '@config/logger.js';
import ntpClient from 'ntp-client';
import { format, isValid, parse } from 'date-fns';
import httpStatus from 'http-status';
import fs from 'fs/promises';
import path from 'path';

const createSystemSettings = async (settingsData, userId, ip) => {
  const existingSettings = await SystemSettingsModel.findOne();
  if (existingSettings) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.SYSTEM_SETTINGS_ALREADY_EXIST);
  }

  const settings = await SystemSettingsModel.create(settingsData);
  const cacheKey = 'systemSettings';
  const client = await getRedisClient();
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(settings));
    logger.info('System settings cached successfully');
  } catch (cacheError) {
    logger.warn(`Failed to cache new system settings: ${cacheError.message}`);
  }

  return settings;
};

const getSystemSettings = async () => {
  const cacheKey = 'systemSettings';
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for system settings');
      return JSON.parse(cached);
    }
  } catch (cacheError) {
    logger.warn(`Redis cache unavailable: ${cacheError.message}`);
  }

  const settings = await SystemSettingsModel.findOne();
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SYSTEM_SETTINGS_NOT_FOUND);
  }

  try {
    await client.setEx(cacheKey, 300, JSON.stringify(settings));
    logger.info('System settings cached successfully');
  } catch (cacheError) {
    logger.warn(`Failed to cache system settings: ${cacheError.message}`);
  }

  return settings;
};

const updateSystemSettings = async (updateBody, userId, ip) => {
  const settings = await SystemSettingsModel.findOne();
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SYSTEM_SETTINGS_NOT_FOUND);
  }

  Object.assign(settings, updateBody);
  await settings.save();

  const cacheKey = 'systemSettings';
  const client = await getRedisClient();
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(settings));
    logger.info('System settings updated and cached successfully');
  } catch (cacheError) {
    logger.warn(`Failed to cache updated system settings: ${cacheError.message}`);
  }

  return settings;
};

const syncWithNTPServer = async () => {
  const settings = await getSystemSettings();
  const { ntpServer, timeZone, dateTimeFormat } = settings;
  const fallbackServers = ['time.google.com', 'time.nist.gov'];

  let ntpTime;
  let lastError;
  for (const server of [ntpServer, ...fallbackServers]) {
    try {
      ntpTime = await new Promise((resolve, reject) => {
        ntpClient.getNetworkTime(server, 123, (err, date) => {
          if (err) reject(err);
          resolve(date);
        });
      });
      const formattedTime = format(ntpTime, dateTimeFormat, { timeZone });
      logger.info(`NTP sync successful with ${server}. Time: ${formattedTime}`);
      return { success: true, time: formattedTime };
    } catch (error) {
      lastError = error;
      logger.warn(`NTP sync failed with ${server}: ${error.message}`);
    }
  }
  logger.error(`NTP sync failed with all servers: ${lastError.message}`);
  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `NTP sync failed: ${lastError.message}`);
};

const previewDateTimeFormat = async (formatString, locale) => {
  try {
    const now = new Date();
    const formatted = format(now, formatString, { locale: new Intl.Locale(locale) });
    if (!isValid(parse(formatted, formatString, new Date()))) {
      throw new Error('Invalid date-time format');
    }
    return { preview: formatted };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid date-time format: ${error.message}`);
  }
};

const getLanguagePack = async (language) => {
  const cacheKey = `languagePack:${language}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for language pack: ${language}`);
      return JSON.parse(cached);
    }
  } catch (cacheError) {
    logger.warn(`Failed to retrieve cached language pack: ${cacheError.message}`);
  }

  try {
    const filePath = path.join(__dirname, `@@config/languages/${language}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const languagePack = JSON.parse(data);

    try {
      await client.setEx(cacheKey, 3600, JSON.stringify(languagePack));
      logger.info(`Language pack cached: ${language}`);
    } catch (cacheError) {
      logger.warn(`Failed to cache language pack: ${cacheError.message}`);
    }

    return languagePack;
  } catch (error) {
    logger.error(`Failed to load language pack for ${language}: ${error.message}`);
    throw new ApiError(httpStatus.NOT_FOUND, `Language pack not found: ${language}`);
  }
};

const translateText = async (text, targetLanguage) => {
  const cacheKey = `translation:${targetLanguage}:${text}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for translation: ${text} to ${targetLanguage}`);
      return cached;
    }
  } catch (cacheError) {
    logger.warn(`Failed to retrieve cached translation: ${cacheError.message}`);
  }

  const mockTranslations = {
    en: text,
    hi: text === 'Welcome to the School ERP System' ? 'स्कूल ERP सिस्टम में आपका स्वागत है' : text,
    zh: text === 'Welcome to the School ERP System' ? '欢迎使用学校ERP系统' : text,
  };
  const translatedText = mockTranslations[targetLanguage] || text;

  try {
    await client.setEx(cacheKey, 3600, JSON.stringify(translatedText));
    logger.info(`Translation cached: ${text} to ${targetLanguage}`);
  } catch (cacheError) {
    logger.warn(`Failed to cache translation: ${cacheError.message}`);
  }

  return translatedText;
};

const getRegionalDefaults = async (ipAddress) => {
  const validTimeZones = Intl.supportedValuesOf('timeZone');
  const validCloudProviders = CONSTANTS.CLOUD_PROVIDERS;
  const validDataCenterRegions = CONSTANTS.DATA_CENTER_REGIONS;
  const validFailoverStrategies = CONSTANTS.FAILOVER_STRATEGIES;
  const validInMemoryEngines = CONSTANTS.IN_MEMORY_ENGINES;
  const validDatabaseEngines = CONSTANTS.DATABASE_ENGINES;

  const mockGeoService = (ip) => {
    if (ip.includes('192.168') || ip === '127.0.0.1') {
      return {
        country: 'IN',
        timeZone: 'Asia/Kolkata',
        locale: 'en-IN',
        cloudProvider: ['AWS'],
        dataCenterRegion: ['Mumbai'],
        highAvailabilityCluster: { enabled: true, nodeCount: 3, failoverStrategy: 'Automatic' },
        inMemoryComputing: { enabled: true, engine: 'Redis Enterprise' },
        distributedDatabase: { configuration: 'Replicated', databaseEngine: 'MongoDB' },
      };
    }
    return {
      country: 'US',
      timeZone: 'America/New_York',
      locale: 'en-US',
      cloudProvider: ['AWS'],
      dataCenterRegion: ['US-East-1'],
      highAvailabilityCluster: { enabled: false },
      inMemoryComputing: { enabled: false },
      distributedDatabase: { configuration: 'Replicated', databaseEngine: 'MongoDB' },
    };
  };

  const geoData = mockGeoService(ipAddress);
  if (!validTimeZones.includes(geoData.timeZone)) {
    logger.warn(`Invalid time zone from geo service: ${geoData.timeZone}, defaulting to UTC`);
    geoData.timeZone = 'UTC';
  }
  if (!geoData.cloudProvider.every((cp) => validCloudProviders.includes(cp))) {
    logger.warn(`Invalid cloud provider from geo service: ${geoData.cloudProvider}, defaulting to AWS`);
    geoData.cloudProvider = ['AWS'];
  }
  if (!geoData.dataCenterRegion.every((region) => validDataCenterRegions.includes(region))) {
    logger.warn(`Invalid data center region from geo service: ${geoData.dataCenterRegion}, defaulting to Mumbai`);
    geoData.dataCenterRegion = ['Mumbai'];
  }
  if (geoData.highAvailabilityCluster.enabled && !validFailoverStrategies.includes(geoData.highAvailabilityCluster.failoverStrategy)) {
    logger.warn(`Invalid failover strategy: ${geoData.highAvailabilityCluster.failoverStrategy}, defaulting to Automatic`);
    geoData.highAvailabilityCluster.failoverStrategy = 'Automatic';
  }
  if (geoData.inMemoryComputing.enabled && !validInMemoryEngines.includes(geoData.inMemoryComputing.engine)) {
    logger.warn(`Invalid in-memory engine: ${geoData.inMemoryComputing.engine}, defaulting to Redis Enterprise`);
    geoData.inMemoryComputing.engine = 'Redis Enterprise';
  }
  if (!validDatabaseEngines.includes(geoData.distributedDatabase.databaseEngine)) {
    logger.warn(`Invalid database engine: ${geoData.distributedDatabase.databaseEngine}, defaulting to MongoDB`);
    geoData.distributedDatabase.databaseEngine = 'MongoDB';
  }

  const defaults = {
    timeZone: geoData.timeZone,
    dateTimeFormat: geoData.country === 'IN' ? 'DD-MM-YYYY HH:mm:ss' : 'MM/DD/YYYY HH:mm:ss',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: geoData.country === 'IN' ? '{street}, {city}, {state} {postalCode}, India' : '{street}, {city}, {state} {postalCode}, USA',
    locale: geoData.locale,
    cloudProviders: geoData.cloudProvider,
    dataCenterRegions: geoData.dataCenterRegion,
    highAvailabilityCluster: geoData.highAvailabilityCluster,
    inMemoryComputing: geoData.inMemoryComputing,
    distributedDatabase: geoData.distributedDatabase,
  };

  return defaults;
};

export default {
  createSystemSettings,
  getSystemSettings,
  updateSystemSettings,
  syncWithNTPServer,
  previewDateTimeFormat,
  getLanguagePack,
  translateText,
  getRegionalDefaults,
};