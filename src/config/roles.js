// src/config/roles.js
import RoleModel from '@models/superadmin/role.model.js';
import { getRedisClient } from '@lib/redis.js';
import logger from './logger.js';
import CONSTANTS from '@config/constants.js';

const initializeRoles = async () => {
  const defaultRoles = [
    {
      name: CONSTANTS.ROLES.SUPER_ADMIN,
      permissions: [
        'manageAdmins',
        'getAdmins',
        'updateProfile',
        'changePassword',
        'manageRoles',
        'roles:read',
        'roles:write',
        'flags:read',
        'flags:write',
      ],
    },
    {
      name: CONSTANTS.ROLES.SCHOOL_ADMIN,
      permissions: ['updateProfile', 'changePassword', 'roles:read', 'flags:read'],
    },
  ];

  let client;
  try {
    client = await getRedisClient();
    for (const roleData of defaultRoles) {
      const existingRole = await RoleModel.findOne({ name: roleData.name, isDeleted: false }).exec();
      if (!existingRole) {
        const role = await RoleModel.create({ ...roleData, isDeleted: false }); // No tenantId for superadmin roles
        logger.info(`Initialized role ${role.name}`);
      }
    }
    const roles = await RoleModel.find({ isDeleted: false }).exec();
    const cacheKey = 'roles:init';
    try {
      await client.setEx(cacheKey, 3600, JSON.stringify(roles));
      logger.info('Roles cached during initialization');
    } catch (cacheError) {
      logger.warn(`Failed to cache roles during initialization: ${cacheError.message}`);
    }
    logger.info(`Found ${roles.length} roles in MongoDB`);
  } catch (error) {
    logger.error(`Failed to initialize roles: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const getRoles = async (tenantId = null) => {
  const cacheKey = tenantId ? `role:${tenantId}:all` : 'roles:all';
  let client;
  try {
    client = await getRedisClient();
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for roles${tenantId ? ` for tenant ${tenantId}` : ''}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis unavailable for roles cache: ${error.message}`);
  }

  try {
    const query = tenantId ? { tenantId, isDeleted: false } : { isDeleted: false };
    const roles = await RoleModel.find(query).lean().exec();
    const roleNames = roles.map((role) => role.name);
    if (client) {
      try {
        await client.setEx(cacheKey, 3600, JSON.stringify(roleNames));
        logger.info(`Roles cached${tenantId ? ` for tenant ${tenantId}` : ''}`);
      } catch (cacheError) {
        logger.warn(`Failed to cache roles: ${cacheError.message}`);
      }
    }
    return roleNames;
  } catch (error) {
    logger.error(`Failed to fetch roles from MongoDB: ${error.message}`);
    return [];
  }
};

const getRoleRights = async (roleName, tenantId = null) => {
  const cacheKey = tenantId ? `role:${tenantId}:${roleName}:permissions` : `role:${roleName}:permissions`;
  let client;
  try {
    client = await getRedisClient();
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for role ${roleName} permissions${tenantId ? ` for tenant ${tenantId}` : ''}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis unavailable for role permissions cache: ${error.message}`);
  }

  try {
    const query = tenantId ? { name: roleName, tenantId, isDeleted: false } : { name: roleName, isDeleted: false };
    const role = await RoleModel.findOne(query).lean().exec();
    const permissions = role ? role.permissions : [];
    if (client) {
      try {
        await client.setEx(cacheKey, 3600, JSON.stringify(permissions));
        logger.info(`Role permissions cached for role ${roleName}${tenantId ? ` and tenant ${tenantId}` : ''}`);
      } catch (cacheError) {
        logger.warn(`Failed to cache role permissions: ${cacheError.message}`);
      }
    }
    return permissions;
  } catch (error) {
    logger.error(`Failed to fetch role permissions: ${error.message}`);
    return [];
  }
};

export default { initializeRoles, getRoles, getRoleRights };