import httpStatus from 'http-status';
import enterpriseInfraService from './enterpriseInfra.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogService from '@services/auditLog.service.js';

const createEnterpriseInfra = async (req, res, next) => {
  try {
    const config = await enterpriseInfraService.createEnterpriseInfra(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'enterpriseInfra', tenantId: req.user.tenantId });
    await auditLogService.logAction('CREATE_ENTERPRISE_INFRA', req.user.id, 'EnterpriseInfra', req.body, req.ip, req.user.tenantId);
    logger.info(`Enterprise infra created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, config, i18next.t('settings_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const getEnterpriseInfra = async (req, res, next) => {
  try {
    const config = await enterpriseInfraService.getEnterpriseInfra(req.user.tenantId);
    logger.info(`Enterprise infra retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, config, i18next.t('settings_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const updateEnterpriseInfra = async (req, res, next) => {
  try {
    const config = await enterpriseInfraService.updateEnterpriseInfra(req.body, req.user.id, req.user.tenantId, req.ip);
    settingsUpdateCounter.inc({ module: 'enterpriseInfra', tenantId: req.user.tenantId });
    await auditLogService.logAction('UPDATE_ENTERPRISE_INFRA', req.user.id, 'EnterpriseInfra', req.body, req.ip, req.user.tenantId);
    logger.info(`Enterprise infra updated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, config, i18next.t('settings_updated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteEnterpriseInfra = async (req, res, next) => {
  try {
    await enterpriseInfraService.deleteEnterpriseInfra(req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'enterpriseInfra', tenantId: req.user.tenantId });
    await auditLogService.logAction('DELETE_ENTERPRISE_INFRA', req.user.id, 'EnterpriseInfra', {}, req.ip, req.user.tenantId);
    logger.info(`Enterprise infra deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('settings_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const validateInfrastructure = async (req, res, next) => {
  try {
    const result = await enterpriseInfraService.validateInfrastructure(req.body, req.user.tenantId);
    logger.info(`Infrastructure validated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, result, i18next.t('infrastructure_validated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getInfrastructureStatus = async (req, res, next) => {
  try {
    const status = await enterpriseInfraService.getInfrastructureStatus(req.user.tenantId);
    logger.info(`Infrastructure status retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, status, i18next.t('infrastructure_status_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createEnterpriseInfra,
  getEnterpriseInfra,
  updateEnterpriseInfra,
  deleteEnterpriseInfra,
  validateInfrastructure,
  getInfrastructureStatus,
};