// src/api/v1/modules/superadmin/role/role.service.js
import Role from '@models/superadmin/role.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';
import CONSTANTS from '@constants/index.js';
import roleRepository from '@repositories/systemSettings/role.repository.js';
import roleValidation from './role.validations.js';

const createRole = async (roleData, tenantId, userId, ip) => {
  const { error } = roleValidation.createRole.body.validate(roleData);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const existingRole = await roleRepository.getRoleByName(roleData.name, tenantId);
  if (existingRole && !existingRole.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.ROLE_ALREADY_EXISTS);
  }
  const role = await Role.create({ ...roleData, tenantId, isDeleted: false });
  await SystemSettingsHistory.create({
    tenantId,
    module: 'role',
    action: 'create',
    newValue: role,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`role:${tenantId}:*`);
  await redis.publish('settings:role', JSON.stringify({ tenantId, action: 'create' }));
  logger.info(`Role ${role.name} created for tenant ${tenantId}`);
  return role;
};

const bulkCreateRoles = async (rolesData, tenantId, userId, ip) => {
  const { error } = roleValidation.bulkCreateRoles.body.validate({ roles: rolesData });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const existingRoles = await Role.find({ tenantId, name: { $in: rolesData.map(r => r.name) }, isDeleted: false }).exec();
  const existingRoleNames = existingRoles.map(r => r.name);
  const newRolesData = rolesData.filter(r => !existingRoleNames.includes(r.name));
  if (newRolesData.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All provided roles already exist');
  }
  const roles = await Role.insertMany(newRolesData.map(r => ({ ...r, tenantId, isDeleted: false })));
  await SystemSettingsHistory.create({
    tenantId,
    module: 'role',
    action: 'bulk_create',
    newValue: roles,
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`role:${tenantId}:*`);
  await redis.publish('settings:role', JSON.stringify({ tenantId, action: 'bulk_create' }));
  logger.info(`Bulk roles created for tenant ${tenantId}`);
  return roles;
};

const getRoles = async (query, tenantId) => {
  const { error } = roleValidation.getRoles.query.validate(query);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const rateLimitKey = `role:rate:${tenantId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 100) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many role requests');
  }
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  const roles = await roleRepository.getRoles({ ...query, tenantId });
  logger.info(`Roles retrieved for tenant ${tenantId}`);
  return roles;
};

const getRoleById = async (id, tenantId) => {
  const { error } = roleValidation.getRoleById.params.validate({ id });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const rateLimitKey = `role:rate:${tenantId}`;
  const attempts = await redis.get(rateLimitKey);
  if (attempts && parseInt(attempts) >= 100) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many role requests');
  }
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 3600); // 1 hour rate limit
  const role = await roleRepository.getRoleById(id, tenantId);
  if (!role || role.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  logger.info(`Role ${id} retrieved for tenant ${tenantId}`);
  return role;
};

const updateRole = async (id, updateData, tenantId, userId, ip) => {
  const { error } = roleValidation.updateRole.validate({ params: { id }, body: updateData });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  const previousValue = { name: role.name, permissions: role.permissions };
  Object.assign(role, updateData);
  await role.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'role',
    action: 'update',
    previousValue,
    newValue: { name: role.name, permissions: role.permissions },
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`role:${tenantId}:*`);
  await redis.publish('settings:role', JSON.stringify({ tenantId, action: 'update' }));
  logger.info(`Role ${id} updated for tenant ${tenantId}`);
  return role;
};

const deleteRole = async (id, tenantId, userId, ip) => {
  const { error } = roleValidation.deleteRole.params.validate({ id });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  role.isDeleted = true;
  await role.save();
  await SystemSettingsHistory.create({
    tenantId,
    module: 'role',
    action: 'delete',
    previousValue: { name: role.name, permissions: role.permissions },
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.del(`role:${tenantId}:*`);
  await redis.publish('settings:role', JSON.stringify({ tenantId, action: 'delete' }));
  logger.info(`Role ${id} deleted for tenant ${tenantId}`);
};

const getRolePermissions = async (id, tenantId) => {
  const { error } = roleValidation.getRolePermissions.params.validate({ id });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).select('permissions').exec();
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  logger.info(`Permissions for role ${id} retrieved for tenant ${tenantId}`);
  return role.permissions;
};

const purgeCache = async (tenantId, userId, ip) => {
  await redis.del(`role:${tenantId}:*`);
  await SystemSettingsHistory.create({
    tenantId,
    module: 'role',
    action: 'purge_cache',
    previousValue: {},
    newValue: {},
    changedBy: userId,
    ipAddress: ip,
  });
  await redis.publish('settings:role', JSON.stringify({ tenantId, action: 'purge_cache' }));
  logger.info(`Role cache purged for tenant ${tenantId}`);
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