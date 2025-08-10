import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import enterpriseInfraValidation from './enterpriseInfra.validations.js';
import enterpriseInfraController from './enterpriseInfra.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: EnterpriseInfra
 *     description: Enterprise-grade infrastructure management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/enterprise-infra:
 *   post:
 *     summary: Create enterprise infrastructure configuration
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cloudProviders
 *               - dataCenterRegions
 *               - distributedDatabase
 *               - automatedBackup
 *             properties:
 *               cloudProviders:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['AWS', 'Azure', 'Google Cloud', 'Hybrid']
 *               dataCenterRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['Mumbai', 'Singapore', 'Frankfurt', 'US-East-1', 'Sydney', 'Tokyo', 'London', 'Sao Paulo']
 *               highAvailabilityCluster:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   nodeCount:
 *                     type: number
 *                   failoverStrategy:
 *                     type: string
 *                     enum: ['Manual', 'Automatic', 'Custom']
 *               distributedDatabase:
 *                 type: object
 *                 properties:
 *                   inMemoryEngine:
 *                     type: string
 *                     enum: ['Redis Enterprise']
 *                   engine:
 *                     type: string
 *                     enum: ['MongoDB', 'PostgreSQL', 'MySQL']
 *                   configuration:
 *                     type: string
 *                     enum: ['Sharded', 'Replicated']
 *               automatedBackup:
 *                 type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     enum: ['Incremental', 'Full']
 *                   storageTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Local', 'Cloud']
 *                   drSite:
 *                     type: string
 *                     enum: ['AWS US-East-1', 'Azure West Europe', 'GCP Asia-South1']
 *                   offsite:
 *                     type: boolean
 *               disasterRecovery:
 *                 type: object
 *                 properties:
 *                   rpo:
 *                     type: number
 *                   rto:
 *                     type: number
 *                   drSite:
 *                     type: string
 *                     enum: ['AWS US-East-1', 'Azure West Europe', 'GCP Asia-South1']
 *               aiDrivenLoadBalancing:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   predictiveScaling:
 *                     type: object
 *                     properties:
 *                       threshold:
 *                         type: number
 *                       scaleFactor:
 *                         type: number
 *               securitySettings:
 *                 type: object
 *                 properties:
 *                   encryptionAtRest:
 *                     type: boolean
 *                   firewallEnabled:
 *                     type: boolean
 *                   wafRules:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       201:
 *         description: Enterprise infrastructure configuration created successfully
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
  validate(enterpriseInfraValidation.createEnterpriseInfra),
  enterpriseInfraController.createEnterpriseInfra
);

/**
 * @swagger
 * /v1/superadmin/enterprise-infra:
 *   get:
 *     summary: Retrieve enterprise infrastructure configuration
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enterprise infrastructure configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Enterprise infrastructure configuration not found
 */
router.get(
  '/',
  checkPermission('settings:read'),
  validate(enterpriseInfraValidation.getEnterpriseInfra),
  enterpriseInfraController.getEnterpriseInfra
);

/**
 * @swagger
 * /v1/superadmin/enterprise-infra:
 *   patch:
 *     summary: Update enterprise infrastructure configuration
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cloudProviders:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['AWS', 'Azure', 'Google Cloud', 'Hybrid']
 *               dataCenterRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['Mumbai', 'Singapore', 'Frankfurt', 'US-East-1', 'Sydney', 'Tokyo', 'London', 'Sao Paulo']
 *               highAvailabilityCluster:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   nodeCount:
 *                     type: number
 *                   failoverStrategy:
 *                     type: string
 *                     enum: ['Manual', 'Automatic', 'Custom']
 *               distributedDatabase:
 *                 type: object
 *                 properties:
 *                   inMemoryEngine:
 *                     type: string
 *                     enum: ['Redis Enterprise']
 *                   engine:
 *                     type: string
 *                     enum: ['MongoDB', 'PostgreSQL', 'MySQL']
 *                   configuration:
 *                     type: string
 *                     enum: ['Sharded', 'Replicated']
 *               automatedBackup:
 *                 type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     enum: ['Incremental', 'Full']
 *                   storageTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: ['Local', 'Cloud']
 *                   drSite:
 *                     type: string
 *                     enum: ['AWS US-East-1', 'Azure West Europe', 'GCP Asia-South1']
 *                   offsite:
 *                     type: boolean
 *               disasterRecovery:
 *                 type: object
 *                 properties:
 *                   rpo:
 *                     type: number
 *                   rto:
 *                     type: number
 *                   drSite:
 *                     type: string
 *                     enum: ['AWS US-East-1', 'Azure West Europe', 'GCP Asia-South1']
 *               aiDrivenLoadBalancing:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   predictiveScaling:
 *                     type: object
 *                     properties:
 *                       threshold:
 *                         type: number
 *                       scaleFactor:
 *                         type: number
 *               securitySettings:
 *                 type: object
 *                 properties:
 *                   encryptionAtRest:
 *                     type: boolean
 *                   firewallEnabled:
 *                     type: boolean
 *                   wafRules:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Enterprise infrastructure configuration updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Enterprise infrastructure configuration not found
 */
router.patch(
  '/',
  checkPermission('settings:write'),
  validate(enterpriseInfraValidation.updateEnterpriseInfra),
  enterpriseInfraController.updateEnterpriseInfra
);

/**
 * @swagger
 * /v1/superadmin/enterprise-infra:
 *   delete:
 *     summary: Delete enterprise infrastructure configuration (soft delete)
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enterprise infrastructure configuration deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Enterprise infrastructure configuration not found
 */
router.delete(
  '/',
  checkPermission('settings:write'),
  validate(enterpriseInfraValidation.deleteEnterpriseInfra),
  enterpriseInfraController.deleteEnterpriseInfra
);

/**
 * @swagger
 * /v1/superadmin/enterprise-infra/validate:
 *   post:
 *     summary: Validate enterprise infrastructure configuration
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cloudProviders
 *               - dataCenterRegions
 *             properties:
 *               cloudProviders:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['AWS', 'Azure', 'Google Cloud', 'Hybrid']
 *               dataCenterRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['Mumbai', 'Singapore', 'Frankfurt', 'US-East-1', 'Sydney', 'Tokyo', 'London', 'Sao Paulo']
 *     responses:
 *       200:
 *         description: Infrastructure configuration validated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/validate',
  checkPermission('settings:read'),
  validate(enterpriseInfraValidation.validateInfrastructure),
  enterpriseInfraController.validateInfrastructure
);

/**
 * @swagger
 * /v1/superadmin/enterprise-infra/status:
 *   get:
 *     summary: Retrieve enterprise infrastructure status
 *     tags: [EnterpriseInfra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Infrastructure status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Enterprise infrastructure configuration not found
 */
router.get(
  '/status',
  checkPermission('settings:read'),
  validate(enterpriseInfraValidation.getInfrastructureStatus),
  enterpriseInfraController.getInfrastructureStatus
);

export default router;