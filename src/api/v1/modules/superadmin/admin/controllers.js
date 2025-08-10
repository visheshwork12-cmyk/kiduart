import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync.js';
import responseFormatter from '@utils/responseFormatter.js';
import adminService from './services.js';
import auditLogService from '@services/auditLog.service.js';
import CONSTANTS from '@config/constants.js';

/**
 * @swagger
 * definitions:
 *   Admin:
 *     type: object
 *     properties:
 *       id: { type: string }
 *       email: { type: string, format: email }
 *       name: { type: string }
 *       role: { type: string, enum: ['superadmin', 'admin'] }
 *       phone: { type: string }
 *       address: { type: string }
 *       state: { type: string }
 *       country: { type: string }
 *       city: { type: string }
 *       zipcode: { type: string }
 */

const createAdmin = catchAsync(async (req, res) => {
  const admin = await adminService.createAdmin(req.body, req.user._id, req.ip);
  await auditLogService.logAction('CREATE_ADMIN', req.user._id, 'Admin', { adminId: admin._id }, req.ip, null);
  res.status(httpStatus.CREATED).json(responseFormatter(true, admin, CONSTANTS.MESSAGES.ADMIN_CREATE, httpStatus.CREATED));
});

const getAdmins = catchAsync(async (req, res) => {
  const { page, limit, sortBy } = req.query;
  const admins = await adminService.getAdmins({ page, limit, sortBy });
  res.json(responseFormatter(true, admins, 'Admins retrieved successfully', httpStatus.OK));
});

const getAdmin = catchAsync(async (req, res) => {
  const admin = await adminService.getAdminById(req.params.adminId);
  res.json(responseFormatter(true, admin, CONSTANTS.MESSAGES.ADMIN_DETAILS, httpStatus.OK));
});

const updateAdmin = catchAsync(async (req, res) => {
  const admin = await adminService.updateAdmin(req.params.adminId, req.body, req.user._id, req.ip);
  await auditLogService.logAction('UPDATE_ADMIN', req.user._id, 'Admin', { adminId: req.params.adminId }, req.ip, null);
  res.json(responseFormatter(true, admin, CONSTANTS.MESSAGES.ADMIN_UPDATE, httpStatus.OK));
});

const deleteAdmin = catchAsync(async (req, res) => {
  await adminService.deleteAdmin(req.params.adminId, req.user._id, req.ip);
  await auditLogService.logAction('DELETE_ADMIN', req.user._id, 'Admin', { adminId: req.params.adminId }, req.ip, null);
  res.json(responseFormatter(true, null, CONSTANTS.MESSAGES.ADMIN_STATUS_DELETE, httpStatus.OK));
});

export default {
  createAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
};