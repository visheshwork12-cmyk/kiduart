// src/api/v1/modules/superadmin/auditLog/auditLog.controller.js
import httpStatus from 'http-status';
import auditLogService from './auditLog.service.js';
import  responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogServiceShared from '@services/auditLog.service.js';

const getAuditLog = async (req, res, next) => {
  try {
    const auditLogs = await auditLogService.getAuditLog(req.query, req.user.tenantId);
    await auditLogServiceShared.logAction('GET_AUDIT_LOG', req.user.id, 'auditLog', { query: req.query }, req.ip, req.user.tenantId);
    logger.info(`Audit log retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, auditLogs, i18next.t('audit_log_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const rollbackSettings = async (req, res, next) => {
  try {
    const settings = await auditLogService.rollbackSettings(req.params.historyId, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'auditLog', tenantId: req.user.tenantId });
    await auditLogServiceShared.logAction('ROLLBACK_SETTINGS', req.user.id, 'auditLog', { historyId: req.params.historyId }, req.ip, req.user.tenantId);
    logger.info(`Settings rolled back by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, settings, i18next.t('rollback_success'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteAuditLogs = async (req, res, next) => {
  try {
    await auditLogService.deleteAuditLogs(req.query, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'auditLog', tenantId: req.user.tenantId });
    await auditLogServiceShared.logAction('DELETE_AUDIT_LOGS', req.user.id, 'auditLog', { query: req.query }, req.ip, req.user.tenantId);
    logger.info(`Audit logs deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('audit_logs_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getAuditLogStats = async (req, res, next) => {
  try {
    const stats = await auditLogService.getAuditLogStats(req.query, req.user.tenantId);
    await auditLogServiceShared.logAction('GET_AUDIT_LOG_STATS', req.user.id, 'auditLog', { query: req.query }, req.ip, req.user.tenantId);
    logger.info(`Audit log stats retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, stats, i18next.t('audit_log_stats_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const purgeCache = async (req, res, next) => {
  try {
    await auditLogService.purgeCache(req.user.tenantId, req.user.id, req.ip);
    await auditLogServiceShared.logAction('PURGE_AUDIT_LOG_CACHE', req.user.id, 'auditLog', {}, req.ip, req.user.tenantId);
    logger.info(`Audit log cache purged by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('cache_purged'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getAuditLog,
  rollbackSettings,
  deleteAuditLogs,
  getAuditLogStats,
  purgeCache,
};