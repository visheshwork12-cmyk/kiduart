// src/api/v1/modules/superadmin/featureFlag/featureFlag.controller.js
import httpStatus from 'http-status';
import featureFlagService from './featureFlag.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogService from '@services/auditLog.service.js';

const createFeatureFlag = async (req, res, next) => {
  try {
    const flag = await featureFlagService.createFeatureFlag(req.body, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'featureFlag', tenantId: req.user.tenantId });
    await auditLogService.logAction('CREATE_FEATURE_FLAG', req.user.id, 'featureFlag', { flag: req.body }, req.ip, req.user.tenantId);
    logger.info(`Feature flag created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, flag, i18next.t('feature_flag_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const bulkCreateFeatureFlags = async (req, res, next) => {
  try {
    const flags = await featureFlagService.bulkCreateFeatureFlags(req.body.flags, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'featureFlag', tenantId: req.user.tenantId });
    await auditLogService.logAction('BULK_CREATE_FEATURE_FLAGS', req.user.id, 'featureFlag', { flags: req.body.flags }, req.ip, req.user.tenantId);
    logger.info(`Bulk feature flags created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, flags, i18next.t('feature_flags_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const getFeatureFlags = async (req, res, next) => {
  try {
    const flags = await featureFlagService.getFeatureFlags(req.query, req.user.tenantId);
    await auditLogService.logAction('GET_FEATURE_FLAGS', req.user.id, 'featureFlag', { query: req.query }, req.ip, req.user.tenantId);
    logger.info(`Feature flags retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, flags, i18next.t('feature_flags_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const updateFeatureFlag = async (req, res, next) => {
  try {
    const flag = await featureFlagService.updateFeatureFlag(req.params.name, req.body.enabled, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'featureFlag', tenantId: req.user.tenantId });
    await auditLogService.logAction('UPDATE_FEATURE_FLAG', req.user.id, 'featureFlag', { name: req.params.name, enabled: req.body.enabled }, req.ip, req.user.tenantId);
    logger.info(`Feature flag updated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, flag, i18next.t('feature_flag_updated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const toggleFeatureFlag = async (req, res, next) => {
  try {
    const flag = await featureFlagService.toggleFeatureFlag(req.params.name, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'featureFlag', tenantId: req.user.tenantId });
    await auditLogService.logAction('TOGGLE_FEATURE_FLAG', req.user.id, 'featureFlag', { name: req.params.name }, req.ip, req.user.tenantId);
    logger.info(`Feature flag toggled by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, flag, i18next.t('feature_flag_toggled'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteFeatureFlag = async (req, res, next) => {
  try {
    await featureFlagService.deleteFeatureFlag(req.params.name, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'featureFlag', tenantId: req.user.tenantId });
    await auditLogService.logAction('DELETE_FEATURE_FLAG', req.user.id, 'featureFlag', { name: req.params.name }, req.ip, req.user.tenantId);
    logger.info(`Feature flag deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('feature_flag_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const purgeCache = async (req, res, next) => {
  try {
    await featureFlagService.purgeCache(req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('PURGE_FEATURE_FLAG_CACHE', req.user.id, 'featureFlag', {}, req.ip, req.user.tenantId);
    logger.info(`Feature flag cache purged by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('cache_purged'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createFeatureFlag,
  bulkCreateFeatureFlags,
  getFeatureFlags,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
  purgeCache,
};