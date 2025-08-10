// src/api/v1/modules/superadmin/auditLog/auditLog.routes.js
import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import auditLogController from './auditLog.controller.js';
import auditLogValidation from './auditLog.validations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AuditLog
 *     description: Audit log management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/audit-log:
 *   get:
 *     summary: Retrieve audit logs
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: ['securityFramework', 'coreSystemConfig', 'enterpriseInfra', 'featureFlags', 'rbac', 'auditLog']
 *         description: Filter by module
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: ['create', 'update', 'delete', 'rollback', 'purge_cache']
 *         description: Filter by action
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       changedBy:
 *                         type: string
 *                       module:
 *                         type: string
 *                       previousValue:
 *                         type: object
 *                       newValue:
 *                         type: object
 *                       ipAddress:
 *                         type: string
 *                       tenantId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       429:
 *         description: Too many requests
 */
router.get(
  '/',
  checkPermission('audit:read'),
  validate(auditLogValidation.getAuditLog),
  auditLogController.getAuditLog
);

/**
 * @swagger
 * /v1/superadmin/audit-log/rollback/{historyId}:
 *   post:
 *     summary: Rollback settings to a previous state
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the audit log entry to rollback
 *     responses:
 *       200:
 *         description: Settings rolled back successfully
 *       400:
 *         description: Invalid history ID or module
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Audit log entry or settings not found
 */
router.post(
  '/rollback/:historyId',
  checkPermission('audit:rollback'),
  validate(auditLogValidation.rollbackSettings),
  auditLogController.rollbackSettings
);

/**
 * @swagger
 * /v1/superadmin/audit-log/delete:
 *   delete:
 *     summary: Delete audit logs based on filters
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: ['securityFramework', 'coreSystemConfig', 'enterpriseInfra', 'featureFlags', 'rbac', 'auditLog']
 *         description: Filter by module
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: ['create', 'update', 'delete', 'rollback', 'purge_cache']
 *         description: Filter by action
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Audit logs deleted successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No audit logs found to delete
 */
router.delete(
  '/delete',
  checkPermission('audit:write'),
  validate(auditLogValidation.deleteAuditLogs),
  auditLogController.deleteAuditLogs
);

/**
 * @swagger
 * /v1/superadmin/audit-log/stats:
 *   get:
 *     summary: Retrieve audit log statistics
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Audit log statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                       action:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       userCount:
 *                         type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       429:
 *         description: Too many requests
 */
router.get(
  '/stats',
  checkPermission('audit:read'),
  validate(auditLogValidation.getAuditLogStats),
  auditLogController.getAuditLogStats
);

/**
 * @swagger
 * /v1/superadmin/audit-log/purge-cache:
 *   post:
 *     summary: Purge audit log cache
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache purged successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/purge-cache',
  checkPermission('audit:write'),
  validate(auditLogValidation.purgeCache),
  auditLogController.purgeCache
);

export default router;