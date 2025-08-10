// src/api/v1/modules/superadmin/securityFramework/securityFramework.routes.js
import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import securityFrameworkController from './securityFramework.controller.js';
import securityFrameworkValidation from './securityFramework.validations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: SecurityFramework
 *     description: Security framework management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/security-framework:
 *   post:
 *     summary: Create security framework configuration
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authenticationStack
 *               - encryption
 *               - ipGeofencing
 *               - sessionGovernance
 *               - complianceSuite
 *               - dataMasking
 *             properties:
 *               authenticationStack:
 *                 type: object
 *                 properties:
 *                   methods:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Email OTP', 'SMS OTP', 'App-Based']
 *                   email:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       smtpServer:
 *                         type: string
 *                       smtpPort:
 *                         type: number
 *                   sms:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       provider:
 *                         type: string
 *                         enum: ['Twilio', 'Nexmo']
 *                   appBased:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       secretLength:
 *                         type: number
 *               encryption:
 *                 type: object
 *                 properties:
 *                   standard:
 *                     type: string
 *                     enum: ['AES-256', 'RSA-2048']
 *                   keyRotationFrequency:
 *                     type: number
 *               ipGeofencing:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   whitelist:
 *                     type: array
 *                     items:
 *                       type: string
 *                   blacklist:
 *                     type: array
 *                     items:
 *                       type: string
 *                   geoIpDatabase:
 *                     type: string
 *                     enum: ['GeoLite2', 'MaxMind']
 *               sessionGovernance:
 *                 type: object
 *                 properties:
 *                   idleTimeout:
 *                     type: number
 *                   concurrentLimit:
 *                     type: number
 *               complianceSuite:
 *                 type: object
 *                 properties:
 *                   standards:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['ISO 27001', 'GDPR', 'HIPAA']
 *                   auditLogs:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       retentionPeriod:
 *                         type: number
 *                   reportGeneration:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       format:
 *                         type: string
 *                         enum: ['PDF', 'JSON']
 *               dataMasking:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   fields:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Aadhaar', 'Phone', 'Email', 'Name']
 *                   policy:
 *                     type: string
 *                     enum: ['Full', 'Partial']
 *               tokenBlacklist:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   maxTokens:
 *                     type: number
 *     responses:
 *       201:
 *         description: Security framework configuration created successfully
 *       400:
 *         description: Invalid input or configuration already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.createSecurityFramework),
  securityFrameworkController.createSecurityFramework
);

/**
 * @swagger
 * /v1/superadmin/security-framework:
 *   get:
 *     summary: Retrieve security framework configuration
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security framework configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Security framework configuration not found
 */
router.get(
  '/',
  checkPermission('settings:read'),
  validate(securityFrameworkValidation.getSecurityFramework),
  securityFrameworkController.getSecurityFramework
);

/**
 * @swagger
 * /v1/superadmin/security-framework:
 *   patch:
 *     summary: Update security framework configuration
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authenticationStack:
 *                 type: object
 *                 properties:
 *                   methods:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Email OTP', 'SMS OTP', 'App-Based']
 *                   email:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       smtpServer:
 *                         type: string
 *                       smtpPort:
 *                         type: number
 *                   sms:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       provider:
 *                         type: string
 *                         enum: ['Twilio', 'Nexmo']
 *                   appBased:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       secretLength:
 *                         type: number
 *               encryption:
 *                 type: object
 *                 properties:
 *                   standard:
 *                     type: string
 *                     enum: ['AES-256', 'RSA-2048']
 *                   keyRotationFrequency:
 *                     type: number
 *               ipGeofencing:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   whitelist:
 *                     type: array
 *                     items:
 *                       type: string
 *                   blacklist:
 *                     type: array
 *                     items:
 *                       type: string
 *                   geoIpDatabase:
 *                     type: string
 *                     enum: ['GeoLite2', 'MaxMind']
 *               sessionGovernance:
 *                 type: object
 *                 properties:
 *                   idleTimeout:
 *                     type: number
 *                   concurrentLimit:
 *                     type: number
 *               complianceSuite:
 *                 type: object
 *                 properties:
 *                   standards:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['ISO 27001', 'GDPR', 'HIPAA']
 *                   auditLogs:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       retentionPeriod:
 *                         type: number
 *                   reportGeneration:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       format:
 *                         type: string
 *                         enum: ['PDF', 'JSON']
 *               dataMasking:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   fields:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Aadhaar', 'Phone', 'Email', 'Name']
 *                   policy:
 *                     type: string
 *                     enum: ['Full', 'Partial']
 *               tokenBlacklist:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   maxTokens:
 *                     type: number
 *     responses:
 *       200:
 *         description: Security framework configuration updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Security framework configuration not found
 */
router.patch(
  '/',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.updateSecurityFramework),
  securityFrameworkController.updateSecurityFramework
);

/**
 * @swagger
 * /v1/superadmin/security-framework:
 *   delete:
 *     summary: Delete security framework configuration (soft delete)
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security framework configuration deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Security framework configuration not found
 */
router.delete(
  '/',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.deleteSecurityFramework),
  securityFrameworkController.deleteSecurityFramework
);

/**
 * @swagger
 * /v1/superadmin/security-framework/send-otp:
 *   post:
 *     summary: Send OTP via email or SMS
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *             oneOf:
 *               - required: ['email']
 *               - required: ['phone']
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid input or OTP not enabled
 *       429:
 *         description: Too many OTP requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/send-otp',
  validate(securityFrameworkValidation.sendOTP),
  securityFrameworkController.sendOTP
);

/**
 * @swagger
 * /v1/superadmin/security-framework/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - userId
 *             properties:
 *               otp:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/verify-otp',
  validate(securityFrameworkValidation.verifyOTP),
  securityFrameworkController.verifyOTP
);

/**
 * @swagger
 * /v1/superadmin/security-framework/encrypt:
 *   post:
 *     summary: Encrypt data
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data encrypted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/encrypt',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.encryptData),
  securityFrameworkController.encryptData
);

/**
 * @swagger
 * /v1/superadmin/security-framework/decrypt:
 *   post:
 *     summary: Decrypt data
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encryptedData
 *               - iv
 *               - key
 *             properties:
 *               encryptedData:
 *                 type: string
 *               iv:
 *                 type: string
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data decrypted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/decrypt',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.decryptData),
  securityFrameworkController.decryptData
);

/**
 * @swagger
 * /v1/superadmin/security-framework/check-ip:
 *   post:
 *     summary: Check IP against geofencing rules
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 format: ipv4
 *     responses:
 *       200:
 *         description: IP check completed
 *       400:
 *         description: Invalid IP
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/check-ip',
  checkPermission('settings:read'),
  validate(securityFrameworkValidation.checkIPGeofencing),
  securityFrameworkController.checkIPGeofencing
);

/**
 * @swagger
 * /v1/superadmin/security-framework/compliance-report:
 *   post:
 *     summary: Generate compliance report
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compliance report generated successfully
 *       400:
 *         description: Report generation not enabled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/compliance-report',
  checkPermission('settings:read'),
  validate(securityFrameworkValidation.generateComplianceReport),
  securityFrameworkController.generateComplianceReport
);

/**
 * @swagger
 * /v1/superadmin/security-framework/mask-data:
 *   post:
 *     summary: Mask sensitive data
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - field
 *             properties:
 *               data:
 *                 type: string
 *               field:
 *                 type: string
 *                 enum: ['Aadhaar', 'Phone', 'Email', 'Name']
 *     responses:
 *       200:
 *         description: Data masked successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/mask-data',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.maskData),
  securityFrameworkController.maskData
);

/**
 * @swagger
 * /v1/superadmin/security-framework/status:
 *   get:
 *     summary: Retrieve security framework status
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Security framework configuration not found
 */
router.get(
  '/status',
  checkPermission('settings:read'),
  validate(securityFrameworkValidation.getSecurityStatus),
  securityFrameworkController.getSecurityStatus
);

/**
 * @swagger
 * /v1/superadmin/security-framework/rotate-key:
 *   post:
 *     summary: Rotate encryption key
 *     tags: [SecurityFramework]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Encryption key rotated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Security framework configuration not found
 */
router.post(
  '/rotate-key',
  checkPermission('settings:write'),
  validate(securityFrameworkValidation.rotateEncryptionKey),
  securityFrameworkController.rotateEncryptionKey
);

export default router;