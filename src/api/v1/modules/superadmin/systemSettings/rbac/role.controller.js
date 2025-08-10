// src/api/v1/modules/superadmin/role/role.controller.js
import httpStatus from 'http-status';
import roleService from './role.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import i18next from '@i18n/index.js';
import logger from '@config/logger.js';
import { settingsUpdateCounter } from '@utils/metrics.js';
import auditLogService from '@services/auditLog.service.js';

const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'role', tenantId: req.user.tenantId });
    await auditLogService.logAction('CREATE_ROLE', req.user.id, 'role', { role: req.body }, req.ip, req.user.tenantId);
    logger.info(`Role created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, role, i18next.t('role_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const bulkCreateRoles = async (req, res, next) => {
  try {
    const roles = await roleService.bulkCreateRoles(req.body.roles, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'role', tenantId: req.user.tenantId });
    await auditLogService.logAction('BULK_CREATE_ROLES', req.user.id, 'role', { roles: req.body.roles }, req.ip, req.user.tenantId);
    logger.info(`Bulk roles created by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.CREATED).json(
      responseFormatter(true, roles, i18next.t('roles_created'), httpStatus.CREATED)
    );
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getRoles(req.query, req.user.tenantId);
    await auditLogService.logAction('GET_ROLES', req.user.id, 'role', { query: req.query }, req.ip, req.user.tenantId);
    logger.info(`Roles retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, roles, i18next.t('roles_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id, req.user.tenantId);
    await auditLogService.logAction('GET_ROLE_BY_ID', req.user.id, 'role', { roleId: req.params.id }, req.ip, req.user.tenantId);
    logger.info(`Role ${req.params.id} retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, role, i18next.t('role_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'role', tenantId: req.user.tenantId });
    await auditLogService.logAction('UPDATE_ROLE', req.user.id, 'role', { roleId: req.params.id, update: req.body }, req.ip, req.user.tenantId);
    logger.info(`Role updated by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, role, i18next.t('role_updated'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id, req.user.tenantId, req.user.id, req.ip);
    settingsUpdateCounter.inc({ module: 'role', tenantId: req.user.tenantId });
    await auditLogService.logAction('DELETE_ROLE', req.user.id, 'role', { roleId: req.params.id }, req.ip, req.user.tenantId);
    logger.info(`Role deleted by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('role_deleted'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const permissions = await roleService.getRolePermissions(req.params.id, req.user.tenantId);
    await auditLogService.logAction('GET_ROLE_PERMISSIONS', req.user.id, 'role', { roleId: req.params.id }, req.ip, req.user.tenantId);
    logger.info(`Role permissions retrieved by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, permissions, i18next.t('role_permissions_retrieved'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

const purgeCache = async (req, res, next) => {
  try {
    await roleService.purgeCache(req.user.tenantId, req.user.id, req.ip);
    await auditLogService.logAction('PURGE_ROLE_CACHE', req.user.id, 'role', {}, req.ip, req.user.tenantId);
    logger.info(`Role cache purged by user ${req.user.id} for tenant ${req.user.tenantId}`);
    res.status(httpStatus.OK).json(
      responseFormatter(true, null, i18next.t('cache_purged'), httpStatus.OK)
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createRole,
  bulkCreateRoles,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  purgeCache,
};