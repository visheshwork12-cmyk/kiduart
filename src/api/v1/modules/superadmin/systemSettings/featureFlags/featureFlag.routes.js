// src/api/v1/modules/superadmin/featureFlag/featureFlag.routes.js
import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import featureFlagController from './featureFlag.controller.js';
import featureFlagValidation from './featureFlag.validations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: FeatureFlag
 *     description: Feature flag management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/feature-flag:
 *   post:
 *     summary: Create a new feature flag
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 enum: {CONSTANTS.FEATURE_FLAGS}
 *               enabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Feature flag created successfully
 *       400:
 *         description: Invalid input or flag already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  checkPermission('flags:write'),
  validate(featureFlagValidation.createFeatureFlag),
  featureFlagController.createFeatureFlag
);

/**
 * @swagger
 * /v1/superadmin/feature-flag/bulk:
 *   post:
 *     summary: Create multiple feature flags
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       enum: {CONSTANTS.FEATURE_FLAGS}
 *                     enabled:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Feature flags created successfully
 *       400:
 *         description: Invalid input or flags already exist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/bulk',
  checkPermission('flags:write'),
  validate(featureFlagValidation.bulkCreateFeatureFlags),
  featureFlagController.bulkCreateFeatureFlags
);

/**
 * @swagger
 * /v1/superadmin/feature-flag:
 *   get:
 *     summary: Retrieve feature flags
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Feature flags retrieved successfully
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
 *                       name:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
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
  checkPermission('flags:read'),
  validate(featureFlagValidation.getFeatureFlags),
  featureFlagController.getFeatureFlags
);

/**
 * @swagger
 * /v1/superadmin/feature-flag/{name}:
 *   patch:
 *     summary: Update a feature flag
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: {CONSTANTS.FEATURE_FLAGS}
 *         description: Name of the feature flag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature flag updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Feature flag not found
 */
router.patch(
  '/:name',
  checkPermission('flags:write'),
  validate(featureFlagValidation.updateFeatureFlag),
  featureFlagController.updateFeatureFlag
);

/**
 * @swagger
 * /v1/superadmin/feature-flag/toggle/{name}:
 *   patch:
 *     summary: Toggle a feature flag
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: {CONSTANTS.FEATURE_FLAGS}
 *         description: Name of the feature flag
 *     responses:
 *       200:
 *         description: Feature flag toggled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Feature flag not found
 */
router.patch(
  '/toggle/:name',
  checkPermission('flags:write'),
  validate(featureFlagValidation.toggleFeatureFlag),
  featureFlagController.toggleFeatureFlag
);

/**
 * @swagger
 * /v1/superadmin/feature-flag/{name}:
 *   delete:
 *     summary: Delete a feature flag
 *     tags: [FeatureFlag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: {CONSTANTS.FEATURE_FLAGS}
 *         description: Name of the feature flag
 *     responses:
 *       200:
 *         description: Feature flag deleted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Feature flag not found
 */
router.delete(
  '/:name',
  checkPermission('flags:write'),
  validate(featureFlagValidation.deleteFeatureFlag),
  featureFlagController.deleteFeatureFlag
);

/**
 * @swagger
 * /v1/superadmin/feature-flag/purge-cache:
 *   post:
 *     summary: Purge feature flag cache
 *     tags: [FeatureFlag]
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
  checkPermission('flags:write'),
  validate(featureFlagValidation.purgeCache),
  featureFlagController.purgeCache
);

export default router;