// src/api/v1/modules/superadmin/role/role.routes.js
import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import roleController from './role.controller.js';
import roleValidation from './role.validations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Role
 *     description: Role-based access control management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/role:
 *   post:
 *     summary: Create a new role
 *     tags: [Role]
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
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: {CONSTANTS.PERMISSIONS}
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input or role already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  checkPermission('roles:write'),
  validate(roleValidation.createRole),
  roleController.createRole
);

/**
 * @swagger
 * /v1/superadmin/role/bulk:
 *   post:
 *     summary: Create multiple roles
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: {CONSTANTS.PERMISSIONS}
 *     responses:
 *       201:
 *         description: Roles created successfully
 *       400:
 *         description: Invalid input or roles already exist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/bulk',
  checkPermission('roles:write'),
  validate(roleValidation.bulkCreateRoles),
  roleController.bulkCreateRoles
);

/**
 * @swagger
 * /v1/superadmin/role:
 *   get:
 *     summary: Retrieve roles
 *     tags: [Role]
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
 *         description: Roles retrieved successfully
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
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
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
  checkPermission('roles:read'),
  validate(roleValidation.getRoles),
  roleController.getRoles
);

/**
 * @swagger
 * /v1/superadmin/role/{id}:
 *   get:
 *     summary: Retrieve a role by ID
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       429:
 *         description: Too many requests
 */
router.get(
  '/:id',
  checkPermission('roles:read'),
  validate(roleValidation.getRoleById),
  roleController.getRoleById
);

/**
 * @swagger
 * /v1/superadmin/role/{id}:
 *   patch:
 *     summary: Update a role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: {CONSTANTS.PERMISSIONS}
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.patch(
  '/:id',
  checkPermission('roles:write'),
  validate(roleValidation.updateRole),
  roleController.updateRole
);

/**
 * @swagger
 * /v1/superadmin/role/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.delete(
  '/:id',
  checkPermission('roles:write'),
  validate(roleValidation.deleteRole),
  roleController.deleteRole
);

/**
 * @swagger
 * /v1/superadmin/role/{id}/permissions:
 *   get:
 *     summary: Retrieve permissions for a role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
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
 *                     type: string
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.get(
  '/:id/permissions',
  checkPermission('roles:read'),
  validate(roleValidation.getRolePermissions),
  roleController.getRolePermissions
);

/**
 * @swagger
 * /v1/superadmin/role/purge-cache:
 *   post:
 *     summary: Purge role cache
 *     tags: [Role]
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
  checkPermission('roles:write'),
  validate(roleValidation.purgeCache),
  roleController.purgeCache
);

export default router;