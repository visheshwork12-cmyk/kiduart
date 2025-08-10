import express from 'express';
import validate from '@middleware/validate.middleware.js';
import authMiddleware from '@middleware/auth.middleware.js';
import roleMiddleware from '@middleware/role.middleware.js';
import subscriptionValidation from './validations.js';
import subscriptionController from './controllers.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

/**
 * @swagger
 * /superadmin/subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [SuperAdmin-Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolId
 *               - plan
 *               - startDate
 *               - expiryDate
 *             properties:
 *               schoolId: { type: string }
 *               plan: { type: string, enum: ['basic', 'premium', 'enterprise'] }
 *               startDate: { type: string, format: date }
 *               expiryDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */
router.post('/', validate(subscriptionValidation.createSubscription), subscriptionController.createSubscription);

/**
 * @swagger
 * /superadmin/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [SuperAdmin-Subscriptions]
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
 *         description: List of subscriptions
 */
router.get('/', validate(subscriptionValidation.getSubscriptions), subscriptionController.getSubscriptions);

/**
 * @swagger
 * /superadmin/subscriptions/{subscriptionId}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [SuperAdmin-Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/:subscriptionId', validate(subscriptionValidation.getSubscription), subscriptionController.getSubscription);

/**
 * @swagger
 * /superadmin/subscriptions/{subscriptionId}:
 *   patch:
 *     summary: Update subscription
 *     tags: [SuperAdmin-Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string, enum: ['basic', 'premium', 'enterprise'] }
 *               startDate: { type: string, format: date }
 *               expiryDate: { type: string, format: date }
 *               status: { type: string, enum: ['active', 'expired', 'cancelled'] }
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 */
router.patch('/:subscriptionId', validate(subscriptionValidation.updateSubscription), subscriptionController.updateSubscription);

/**
 * @swagger
 * /superadmin/subscriptions/{subscriptionId}:
 *   delete:
 *     summary: Delete subscription
 *     tags: [SuperAdmin-Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 */
router.delete('/:subscriptionId', validate(subscriptionValidation.deleteSubscription), subscriptionController.deleteSubscription);

export default router;