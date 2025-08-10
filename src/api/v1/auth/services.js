import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import AdminModel from '@models/superadmin/admin.model.js';
import tokenService from '@services/token.service.js';
import ApiError from '@utils/apiError.js';
import CONSTANT from '@config/constants.js';

const registerAdmin = async (adminBody, ipAddress) => {
  if (await AdminModel.findOne({ email: adminBody.email })) {
    throw new ApiError(httpStatus.BAD_REQUEST, CONSTANT.ADMIN_EMAIL_ALREADY_EXISTS);
  }
  const hashedPassword = await bcrypt.hash(adminBody.password, 10);
  const admin = await AdminModel.create({
    ...adminBody,
    password: hashedPassword,
    role: adminBody.role || 'admin',
  });
  return admin;
};

const loginAdmin = async (email, password) => {
  const admin = await AdminModel.findOne({ email }).select('+password');
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, CONSTANT.UNAUTHORIZED_MSG);
  }
  return admin;
};

const refreshAuth = async (refreshToken) => {
  const tokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
  const admin = await AdminModel.findById(tokenDoc.user);
  if (!admin) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Admin not found');
  }
  await tokenDoc.deleteOne();
  return tokenService.generateAuthTokens(admin);
};

const logout = async (refreshToken) => {
  const tokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
  await tokenDoc.deleteOne();
};

const forgotPassword = async (email) => {
  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANT.ADMIN_NOT_FOUND);
  }
  return tokenService.generateResetPasswordToken(admin);
};

const resetPassword = async (token, newPassword) => {
  const tokenDoc = await tokenService.verifyToken(token, 'resetPassword');
  const admin = await AdminModel.findById(tokenDoc.user);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANT.ADMIN_NOT_FOUND);
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  admin.password = hashedPassword;
  await admin.save();
  await tokenDoc.deleteOne();
};

export default {
  registerAdmin,
  loginAdmin,
  refreshAuth,
  logout,
  forgotPassword,
  resetPassword,
};