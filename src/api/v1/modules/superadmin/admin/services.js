import httpStatus from 'http-status';
import adminRepository from '@repositories/admin.repository.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@config/constants.js';
import emailService from '@services/email.service.js';
import { getRedisClient } from '@lib/redis.js';
import logger from '@config/logger.js';

const createAdmin = async (adminBody, userId, ip) => {
  const { email } = adminBody;
  if (await adminRepository.findAdminByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.ADMIN_EMAIL_ALREADY_EXISTS);
  }
  const admin = await adminRepository.createAdmin(adminBody);
  await emailService.sendNewAdminEmail(admin.email, admin.name, adminBody.password);
  return admin;
};

const getAdmins = async ({ page = 1, limit = 10, sortBy = 'createdAt:desc' }) => {
  const cacheKey = `admins:${page}:${limit}:${sortBy}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for admins');
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache unavailable: ${error.message}`);
  }

  const [sortField, sortOrder] = sortBy.split(':');
  const filter = {};
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy: `${sortField}:${sortOrder}`,
  };
  const admins = await adminRepository.findAdmins(filter, options);
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(admins));
  } catch (cacheError) {
    logger.warn(`Failed to cache admins: ${cacheError.message}`);
  }
  return admins;
};

const getAdminById = async (adminId) => {
  const cacheKey = `admin:${adminId}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for admin');
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache unavailable: ${error.message}`);
  }

  const admin = await adminRepository.findAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ADMIN_NOT_FOUND);
  }
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(admin));
  } catch (cacheError) {
    logger.warn(`Failed to cache admin: ${cacheError.message}`);
  }
  return admin;
};

const updateAdmin = async (adminId, updateBody, userId, ip) => {
  const admin = await adminRepository.findAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ADMIN_NOT_FOUND);
  }
  if (updateBody.email && (await adminRepository.findAdminByEmail(updateBody.email))) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANTS.MESSAGES.ADMIN_EMAIL_ALREADY_EXISTS);
  }
  return adminRepository.updateAdmin(adminId, updateBody);
};

const deleteAdmin = async (adminId, userId, ip) => {
  const admin = await adminRepository.findAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.ADMIN_NOT_FOUND);
  }
  return adminRepository.deleteAdmin(adminId);
};

export default {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};