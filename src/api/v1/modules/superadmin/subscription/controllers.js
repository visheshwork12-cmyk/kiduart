import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync.js';
import responseFormatter from '@utils/responseFormatter.js';
import subscriptionService from './services.js';
import auditLogService from '@services/auditLog.service.js';
import CONSTANTS from '@config/constants.js';

/**
 * @swagger
 * definitions:
 *   Subscription:
 *     type: object
 *     properties:
 *       id: { type: string }
 *       schoolId: { type: string }
 *       plan: { type: string, enum: ['basic', 'premium', 'enterprise'] }
 *       startDate: { type: string, format: date }
 *       expiryDate: { type: string, format: date }
 *       status: { type: string, enum: ['active', 'expired', 'cancelled'] }
 */

const createSubscription = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.createSubscription(req.body, req.user, req.ip);
  await auditLogService.logAction('CREATE_SUBSCRIPTION', req.user._id, 'Subscription', { subscriptionId: subscription._id }, req.ip, null);
  res.status(httpStatus.CREATED).json(responseFormatter(true, subscription, CONSTANTS.MESSAGES.SUBSCRIPTION_CREATE, httpStatus.CREATED));
});

const getSubscriptions = catchAsync(async (req, res) => {
  const { page, limit, sortBy } = req.query;
  const subscriptions = await subscriptionService.getSubscriptions({ page, limit, sortBy });
  res.json(responseFormatter(true, subscriptions, 'Subscriptions retrieved successfully', httpStatus.OK));
});

const getSubscription = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.getSubscriptionById(req.params.subscriptionId);
  res.json(responseFormatter(true, subscription, 'Subscription retrieved successfully', httpStatus.OK));
});

const updateSubscription = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.updateSubscription(req.params.subscriptionId, req.body, req.user, req.ip);
  await auditLogService.logAction('UPDATE_SUBSCRIPTION', req.user._id, 'Subscription', { subscriptionId: req.params.subscriptionId }, req.ip, null);
  res.json(responseFormatter(true, subscription, 'Subscription updated successfully', httpStatus.OK));
});

const deleteSubscription = catchAsync(async (req, res) => {
  await subscriptionService.deleteSubscription(req.params.subscriptionId, req.user, req.ip);
  await auditLogService.logAction('DELETE_SUBSCRIPTION', req.user._id, 'Subscription', { subscriptionId: req.params.subscriptionId }, req.ip, null);
  res.json(responseFormatter(true, null, 'Subscription deleted successfully', httpStatus.OK));
});

export default {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
};