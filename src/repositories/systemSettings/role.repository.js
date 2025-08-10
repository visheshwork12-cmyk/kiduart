import Role from '@models/superadmin/role.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import redis from '@lib/redis.js';
import logger from '@config/logger.js';

const getRoleByName = async (name, tenantId) => {
  return Role.findOne({ name, tenantId }).exec();
};

const getRoles = async ({ tenantId, page = 1, limit = 20 }) => {
  const cacheKey = `role:${tenantId}:${page}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for roles for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const roles = await Role.find({ tenantId, isDeleted: false })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean()
    .exec();
  const total = await Role.countDocuments({ tenantId, isDeleted: false });
  const result = { data: roles, total, page: parseInt(page), limit: parseInt(limit) };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
  logger.info(`Roles cached for tenant ${tenantId}`);
  return result;
};

const getRoleById = async (id, tenantId) => {
  const cacheKey = `role:${tenantId}:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info(`Cache hit for role ${id} for tenant ${tenantId}`);
    return JSON.parse(cached);
  }
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).lean().exec();
  if (role) {
    await redis.set(cacheKey, JSON.stringify(role), 'EX', 300);
    logger.info(`Role ${id} cached for tenant ${tenantId}`);
  }
  return role;
};

const updateRole = async (id, updateData, tenantId) => {
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  Object.assign(role, updateData);
  await role.save();
  await redis.del(`role:${tenantId}:*`);
  logger.info(`Role ${id} cache invalidated for tenant ${tenantId}`);
  return role;
};

const deleteRole = async (id, tenantId) => {
  const role = await Role.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  if (!role) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  }
  role.isDeleted = true;
  await role.save();
  await redis.del(`role:${tenantId}:*`);
  logger.info(`Role ${id} cache invalidated for tenant ${tenantId}`);
  return role;
};

export default {
  getRoleByName,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};