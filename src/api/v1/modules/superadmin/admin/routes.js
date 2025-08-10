import express from 'express';
import validate from '@middleware/validate.middleware.js';
import authMiddleware from '@middleware/auth.middleware.js';
import roleMiddleware from '@middleware/role.middleware.js';
import adminValidation from './validations.js';
import adminController from './controllers.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

/**
 * @swagger
 * /superadmin/admins:
 *   post:
 *     summary: Create a new admin
 *     tags: [SuperAdmin-Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: ['superadmin', 'admin'] }
 *               phone: { type: string }
 *               address: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               city: { type: string }
 *               zipcode: { type: string }
 *     responses:
 *       201:
 *         description: Admin created successfully
 */
router.post('/', validate(adminValidation.createAdmin), adminController.createAdmin);

/**
 * @swagger
 * /superadmin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [SuperAdmin-Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., createdAt:desc)
 *     responses:
 *       200:
 *         description: List of admins
 */
router.get('/', validate(adminValidation.getAdmins), adminController.getAdmins);

/**
 * @swagger
 * /superadmin/admins/{adminId}:
 *   get:
 *     summary: Get admin by ID
 *     tags: [SuperAdmin-Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin details
 */
router.get('/:adminId', validate(adminValidation.getAdmin), adminController.getAdmin);

/**
 * @swagger
 * /superadmin/admins/{adminId}:
 *   patch:
 *     summary: Update admin
 *     tags: [SuperAdmin-Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               role: { type: string, enum: ['superadmin', 'admin'] }
 *               phone: { type: string }
 *               address: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               city: { type: string }
 *               zipcode: { type: string }
 *     responses:
 *       200:
 *         description: Admin updated successfully
 */
router.patch('/:adminId', validate(adminValidation.updateAdmin), adminController.updateAdmin);

/**
 * @swagger
 * /superadmin/admins/{adminId}:
 *   delete:
 *     summary: Delete admin
 *     tags: [SuperAdmin-Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 */
router.delete('/:adminId', validate(adminValidation.deleteAdmin), adminController.deleteAdmin);

export default router;