import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync.js';
import responseFormatter from '@utils/responseFormatter.js';
import authService from './services.js';
import tokenService from '@services/token.service.js';
import emailService from '@services/email.service.js';
import CONSTANT from '@config/constants.js';
import auditLogService from '@services/auditLog.service.js';

/**
 * @swagger
 * definitions:
 *   Token:
 *     type: object
 *     properties:
 *       access:
 *         type: object
 *         properties:
 *           token: { type: string }
 *           expires: { type: string, format: date-time }
 *       refresh:
 *         type: object
 *         properties:
 *           token: { type: string }
 *           expires: { type: string, format: date-time }
 *   Response:
 *     type: object
 *     properties:
 *       success: { type: boolean }
 *       data: { type: object }
 *       message: { type: string }
 *       code: { type: integer }
 */

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               role: { type: string, enum: ['superadmin', 'admin'], default: 'admin' }
 *               phone: { type: string }
 *               address: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               city: { type: string }
 *               zipcode: { type: string }
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       $ref: '#/definitions/Admin'
 *                     tokens:
 *                       $ref: '#/definitions/Token'
 *       400:
 *         description: Bad request (e.g., email already exists)
 */
const register = catchAsync(async (req, res) => {
  const admin = await authService.registerAdmin(req.body, req.ip);
  const tokens = await tokenService.generateAuthTokens(admin);
  await auditLogService.logAction('REGISTER_ADMIN', admin._id, 'Admin', { email: admin.email }, req.ip, null);
  res.status(httpStatus.CREATED).json(responseFormatter(true, { admin, tokens }, CONSTANT.MESSAGES.REGISTER, httpStatus.CREATED));
});

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       $ref: '#/definitions/Admin'
 *                     tokens:
 *                       $ref: '#/definitions/Token'
 *       401:
 *         description: Unauthorized (invalid credentials)
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const admin = await authService.loginAdmin(email, password);
  const tokens = await tokenService.generateAuthTokens(admin);
  await auditLogService.logAction('LOGIN_ADMIN', admin._id, 'Admin', { email }, req.ip, null);
  res.json(responseFormatter(true, { admin, tokens }, CONSTANT.MESSAGES.LOGIN, httpStatus.OK));
});

/**
 * @swagger
 * /v1/auth/refresh-token:
 *   post:
 *     summary: Refresh authentication tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/definitions/Token'
 *       401:
 *         description: Invalid refresh token
 */
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.json(responseFormatter(true, { tokens }, 'Tokens refreshed successfully', httpStatus.OK));
});

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     summary: Logout an admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *       401:
 *         description: Invalid refresh token
 */
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  await auditLogService.logAction('LOGOUT_ADMIN', req.user._id, 'Admin', {}, req.ip, null);
  res.json(responseFormatter(true, {}, CONSTANT.MESSAGES.LOGOUT, httpStatus.OK));
});

/**
 * @swagger
 * /v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset password link sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *       404:
 *         description: Admin not found
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const resetToken = await authService.forgotPassword(email);
  await emailService.sendResetPasswordEmail(email, resetToken);
  res.json(responseFormatter(true, {}, CONSTANT.MESSAGES.FORGOT_PASSWORD, httpStatus.OK));
});

/**
 * @swagger
 * /v1/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *       401:
 *         description: Invalid or expired token
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json(responseFormatter(true, {}, CONSTANT.MESSAGES.CHANGE_PASSWORD, httpStatus.OK));
});

/**
 * @swagger
 * /v1/auth/profile:
 *   get:
 *     summary: Get authenticated admin's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Response'
 *               properties:
 *                 data:
 *                   $ref: '#/definitions/Admin'
 *       401:
 *         description: Unauthorized
 */
const getProfile = catchAsync(async (req, res) => {
  res.json(responseFormatter(true, req.user, CONSTANT.MESSAGES.ADMIN_DETAILS, httpStatus.OK));
});

export default {
  register,
  login,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
};