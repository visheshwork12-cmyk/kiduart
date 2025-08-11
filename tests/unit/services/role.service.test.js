// tests/unit/services/role.service.test.js
import roleService from '@api/v1/modules/superadmin/systemSettings/rbac/role.service.js';
import Role from '@models/superadmin/role.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import redis from '@lib/redis.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import logger from '@config/logger.js';
import mongoose from 'mongoose';
import CONSTANTS from '@constants/index.js';

jest.mock('@models/superadmin/role.model.js');
jest.mock('@models/superadmin/systemSettingsHistory.model.js');
jest.mock('@lib/redis.js');
jest.mock('@config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Role Service', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const ip = '127.0.0.1';
  const roleData = { name: 'admin', permissions: ['roles:read', 'roles:write'] };
  const roleDoc = { ...roleData, tenantId, isDeleted: false, save: jest.fn().mockResolvedValueThis() };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(1);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    redis.publish.mockResolvedValue(1);
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      Role.create.mockResolvedValue(roleDoc);
      SystemSettingsHistory.create.mockResolvedValue({});
      const result = await roleService.createRole(roleData, tenantId, userId, ip);
      expect(result).toEqual(roleDoc);
      expect(Role.create).toHaveBeenCalledWith({ ...roleData, tenantId, isDeleted: false });
      expect(redis.del).toHaveBeenCalledWith(`role:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Role ${roleData.name} created for tenant ${tenantId}`);
    });

    it('should throw error if role already exists', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(roleDoc) });
      await expect(roleService.createRole(roleData, tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.ROLE_ALREADY_EXISTS)
      );
    });
  });

  describe('bulkCreateRoles', () => {
    it('should create multiple roles', async () => {
      Role.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      Role.insertMany.mockResolvedValue([roleDoc]);
      SystemSettingsHistory.create.mockResolvedValue({});
      const roles = [roleData];
      const result = await roleService.bulkCreateRoles(roles, tenantId, userId, ip);
      expect(result).toEqual([roleDoc]);
      expect(Role.insertMany).toHaveBeenCalledWith(roles.map(r => ({ ...r, tenantId, isDeleted: false })));
      expect(redis.del).toHaveBeenCalledWith(`role:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Bulk roles created for tenant ${tenantId}`);
    });

    it('should throw error if all roles already exist', async () => {
      Role.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([roleDoc]) });
      await expect(roleService.bulkCreateRoles([roleData], tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'All provided roles already exist')
      );
    });
  });

  describe('getRoles', () => {
    it('should retrieve roles from cache', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ data: [roleData], total: 1, page: 1, limit: 10 }));
      const result = await roleService.getRoles({ page: 1, limit: 10 }, tenantId);
      expect(result).toEqual({ data: [roleData], total: 1, page: 1, limit: 10 });
      expect(Role.find).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Cache hit for roles for tenant ${tenantId}`);
    });

    it('should retrieve roles from database', async () => {
      Role.find.mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([roleData]) }) }) }) });
      Role.countDocuments.mockResolvedValue(1);
      const result = await roleService.getRoles({ page: 1, limit: 10 }, tenantId);
      expect(result.data).toEqual([roleData]);
      expect(redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Roles cached for tenant ${tenantId}`);
    });

    it('should throw error for too many requests', async () => {
      redis.get.mockResolvedValue('100');
      await expect(roleService.getRoles({}, tenantId)).rejects.toThrow(
        new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many role requests')
      );
    });
  });

  describe('getRoleById', () => {
    it('should retrieve a role by ID', async () => {
      Role.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(roleDoc) }) });
      const result = await roleService.getRoleById(roleDoc._id, tenantId);
      expect(result).toEqual(roleDoc);
      expect(redis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
      expect(logger.info).toHaveBeenCalledWith(`Role ${roleDoc._id} retrieved for tenant ${tenantId}`);
    });

    it('should throw error if role not found', async () => {
      Role.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(roleService.getRoleById('invalid-id', tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND)
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(roleDoc) });
      SystemSettingsHistory.create.mockResolvedValue({});
      const updateData = { permissions: ['roles:read'] };
      const result = await roleService.updateRole(roleDoc._id, updateData, tenantId, userId, ip);
      expect(result).toEqual(roleDoc);
      expect(roleDoc.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`role:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Role ${roleDoc._id} updated for tenant ${tenantId}`);
    });

    it('should throw error if role not found', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(roleService.updateRole('invalid-id', { permissions: ['roles:read'] }, tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND)
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(roleDoc) });
      SystemSettingsHistory.create.mockResolvedValue({});
      await roleService.deleteRole(roleDoc._id, tenantId, userId, ip);
      expect(roleDoc.isDeleted).toBe(true);
      expect(roleDoc.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`role:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Role ${roleDoc._id} deleted for tenant ${tenantId}`);
    });

    it('should throw error if role not found', async () => {
      Role.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(roleService.deleteRole('invalid-id', tenantId, userId, ip)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND)
      );
    });
  });

  describe('getRolePermissions', () => {
    it('should retrieve role permissions', async () => {
      Role.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ permissions: roleData.permissions }) }) });
      const result = await roleService.getRolePermissions(roleDoc._id, tenantId);
      expect(result).toEqual(roleData.permissions);
      expect(logger.info).toHaveBeenCalledWith(`Permissions for role ${roleDoc._id} retrieved for tenant ${tenantId}`);
    });

    it('should throw error if role not found', async () => {
      Role.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(roleService.getRolePermissions('invalid-id', tenantId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ROLE_NOT_FOUND)
      );
    });
  });

  describe('purgeCache', () => {
    it('should purge role cache', async () => {
      SystemSettingsHistory.create.mockResolvedValue({});
      await roleService.purgeCache(tenantId, userId, ip);
      expect(redis.del).toHaveBeenCalledWith(`role:${tenantId}:*`);
      expect(logger.info).toHaveBeenCalledWith(`Role cache purged for tenant ${tenantId}`);
    });
  });
});