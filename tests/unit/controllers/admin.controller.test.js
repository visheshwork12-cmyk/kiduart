import adminController from '@api/v1/modules/superadmin/admin/controllers.js';
import adminService from '@services/admin.service.js';
import auditLogService from '@services/auditLog.service.js';
import responseFormatter from '@utils/responseFormatter.js';
import httpStatus from 'http-status';

jest.mock('@services/admin.service.js');
jest.mock('@services/auditLog.service.js');
jest.mock('@shared/utils/responseFormatter.js');

describe('Admin Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: 'userId' },
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createAdmin', () => {
    it('should create an admin and log action', async () => {
      const adminData = {
        email: 'newadmin@example.com',
        name: 'New Admin',
        role: 'admin',
      };
      adminService.createAdmin.mockResolvedValue(adminData);
      auditLogService.logAction.mockResolvedValue();
      responseFormatter.mockReturnValue({ success: true, data: adminData });

      req.body = adminData;
      await adminController.createAdmin(req, res);

      expect(adminService.createAdmin).toHaveBeenCalledWith(adminData, 'userId', '127.0.0.1');
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_ADMIN',
        'userId',
        'Admin',
        { email: adminData.email },
        '127.0.0.1',
        null
      );
      expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: adminData });
    });
  });

  describe('updateAdmin', () => {
    it('should update an admin and log action', async () => {
      const updatedAdmin = { email: 'updated@example.com', name: 'Updated Admin' };
      adminService.updateAdmin.mockResolvedValue(updatedAdmin);
      auditLogService.logAction.mockResolvedValue();
      responseFormatter.mockReturnValue({ success: true, data: updatedAdmin });

      req.params.adminId = 'adminId';
      req.body = { name: 'Updated Admin' };
      await adminController.updateAdmin(req, res);

      expect(adminService.updateAdmin).toHaveBeenCalledWith('adminId', { name: 'Updated Admin' }, 'userId', '127.0.0.1');
      expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    });
  });
});