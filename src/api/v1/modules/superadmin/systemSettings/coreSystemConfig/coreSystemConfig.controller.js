import httpStatus from 'http-status';
import coreSystemConfigService from './coreSystemConfig.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogService from '@services/auditLog.service.js';

const createCoreSystemConfig = async (req, res, next) => {
  try {
    const config = await coreSystemConfigService.createCoreSystemConfig(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'coreSystemConfig', tenantId: req.user.tenantId });
    await auditLogService.logAction('CREATE_CORE_CONFIG', req.user.id, 'CoreSystemConfig', req.body, req.ip, req.user.tenantId);
    logger.info(`Core system config created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, config, i18next.t('settings_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const getCoreSystemConfig = async (req, res, next) => {
  try {
    const config = await coreSystemConfigService.getCoreSystemConfig(req.user.tenantId);
    logger.info(`Core system config retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, config, i18next.t('settings_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const updateCoreSystemConfig = async (req, res, next) => {
  try {
    const config = await coreSystemConfigService.updateCoreSystemConfig(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'coreSystemConfig', tenantId: req.user.tenantId });
    await auditLogService.logAction('UPDATE_CORE_CONFIG', req.user.id, 'CoreSystemConfig', req.body, req.ip, req.user.tenantId);
    logger.info(`Core system config updated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, config, i18next.t('settings_updated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteCoreSystemConfig = async (req, res, next) => {
  try {
    await coreSystemConfigService.deleteCoreSystemConfig(req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'coreSystemConfig', tenantId: req.user.tenantId });
    await auditLogService.logAction('DELETE_CORE_CONFIG', req.user.id, 'CoreSystemConfig', {}, req.ip, req.user.tenantId);
    logger.info(`Core system config deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('settings_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const syncWithNTPServer = async (req, res, next) => {
  try {
    const result = await coreSystemConfigService.syncWithNTPServer(req.user.tenantId);
    logger.info(`NTP sync performed by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('ntp_sync_success'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const previewDateTimeFormat = async (req, res, next) => {
  try {
    const { format, locale } = req.body;
    const result = await coreSystemConfigService.previewDateTimeFormat(format, locale);
    logger.info(`Date-time format previewed by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('datetime_format_previewed'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getLanguagePack = async (req, res, next) => {
  try {
    const { language } = req.params;
    const languagePack = await coreSystemConfigService.getLanguagePack(language, req.user.tenantId);
    logger.info(`Language pack retrieved for ${language} by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, languagePack, i18next.t('language_pack_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;
    const translatedText = await coreSystemConfigService.translateText(text, targetLanguage, req.user.tenantId);
    logger.info(`Text translated to ${targetLanguage} by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, translatedText, i18next.t('text_translated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getRegionalDefaults = async (req, res, next) => {
  try {
    const defaults = await coreSystemConfigService.getRegionalDefaults(req.query.ipAddress || req.ip, req.user.tenantId);
    logger.info(`Regional defaults retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, defaults, i18next.t('regional_defaults_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
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