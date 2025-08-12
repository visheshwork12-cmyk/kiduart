import authService from '@api/v1/auth/services.js';
import AdminModel from '@models/superadmin/admin.model.js';
import tokenService from '@services/token.service.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';

jest.mock('@models/superadmin/admin.model');
jest.mock('@services/token.service');

describe('Auth Service Unit Tests', () => {
  describe('login', () => {
    it('should login with valid credentials', async () => {
      const admin = {
        _id: 'adminId',
        email: 'admin@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'admin',
      };
      AdminModel.findOne.mockResolvedValue(admin);
      tokenService.generateAuthTokens.mockResolvedValue({
        access: { token: 'accessToken', expires: new Date() },
        refresh: { token: 'refreshToken', expires: new Date() },
      });

      const result = await authService.login('admin@example.com', 'Password123!');

      expect(AdminModel.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith(admin);
      expect(result.admin).toEqual(admin);
      expect(result.tokens.access.token).toBe('accessToken');
    });

    it('should throw error for invalid credentials', async () => {
      AdminModel.findOne.mockResolvedValue(null);

      await expect(authService.login('admin@example.com', 'Password123!')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Admin not found')
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      tokenService.verifyToken.mockResolvedValue({ deleteOne: jest.fn() });

      await authService.logout('refreshToken');

      expect(tokenService.verifyToken).toHaveBeenCalledWith('refreshToken', 'refresh');
    });
  });
});