import express from 'express';
import validate from '@middleware/validate.middleware.js';
import authValidation from './validations.js';
import authController from './controllers.js';
import  authMiddleware from '@middleware/auth.middleware.js';
import { authLimiter } from '@middleware/rateLimiter.middleware.js';

const router = express.Router();

router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/refresh-token', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

router.get('/profile', authMiddleware, authController.getProfile);

export default router;