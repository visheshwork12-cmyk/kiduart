// src/api/v1/modules/superadmin/auditLog/auditLog.validations.js
import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const getAuditLog = {
  query: Joi.object().keys({
    module: Joi.string().valid('securityFramework', 'coreSystemConfig', 'enterpriseInfra', 'featureFlags', 'rbac', 'auditLog').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional().min(Joi.ref('startDate')),
    action: Joi.string().valid('create', 'update', 'delete', 'rollback', 'purge_cache').optional(),
    userId: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const rollbackSettings = {
  params: Joi.object().keys({
    historyId: Joi.string().required(),
  }),
};

const deleteAuditLogs = {
  query: Joi.object().keys({
    module: Joi.string().valid('securityFramework', 'coreSystemConfig', 'enterpriseInfra', 'featureFlags', 'rbac', 'auditLog').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional().min(Joi.ref('startDate')),
    action: Joi.string().valid('create', 'update', 'delete', 'rollback', 'purge_cache').optional(),
    userId: Joi.string().optional(),
  }),
};

const getAuditLogStats = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional().min(Joi.ref('startDate')),
  }),
};

const purgeCache = {
  query: Joi.object().keys({}),
};

export default {
  getAuditLog,
  rollbackSettings,
  deleteAuditLogs,
  getAuditLogStats,
  purgeCache,
};