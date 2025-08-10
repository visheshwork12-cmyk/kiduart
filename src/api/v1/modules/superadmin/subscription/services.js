import httpStatus from 'http-status';
import subscriptionRepository from '@repositories/subscription.repository.js';
// import schoolRepository from '@repositories/school.repository.js';
import ApiError from '@utils/apiError.js';
import CONSTANTS from '@config/constants.js';
import { getRedisClient } from '@lib/redis.js';
import logger from '@config/logger.js';

const createSubscription = async (subscriptionBody, user, ip) => {
  const { schoolId, plan } = subscriptionBody;
  const school = await schoolRepository.findSchoolById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SCHOOL_NOT_FOUND);
  }
  return subscriptionRepository.createSubscription(subscriptionBody);
};

const getSubscriptions = async ({ page = 1, limit = 10, sortBy = 'createdAt:desc' }) => {
  const cacheKey = `subscriptions:${page}:${limit}:${sortBy}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for subscriptions');
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache unavailable: ${error.message}`);
  }

  const filter = {};
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
  };
  const subscriptions = await subscriptionRepository.findSubscriptions(filter, options);
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(subscriptions));
  } catch (cacheError) {
    logger.warn(`Failed to cache subscriptions: ${cacheError.message}`);
  }
  return subscriptions;
};

const getSubscriptionById = async (subscriptionId) => {
  const cacheKey = `subscription:${subscriptionId}`;
  const client = await getRedisClient();
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for subscription');
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache unavailable: ${error.message}`);
  }

  const subscription = await subscriptionRepository.findSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SUBSCRIPTION_NOT_FOUND);
  }
  try {
    await client.setEx(cacheKey, 300, JSON.stringify(subscription));
  } catch (cacheError) {
    logger.warn(`Failed to cache subscription: ${cacheError.message}`);
  }
  return subscription;
};

const updateSubscription = async (subscriptionId, updateBody, user, ip) => {
  const subscription = await subscriptionRepository.findSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SUBSCRIPTION_NOT_FOUND);
  }
  if (updateBody.schoolId) {
    const school = await schoolRepository.findSchoolById(updateBody.schoolId);
    if (!school) {
      throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SCHOOL_NOT_FOUND);
    }
  }
  return subscriptionRepository.updateSubscription(subscriptionId, updateBody);
};

const deleteSubscription = async (subscriptionId, user, ip) => {
  const subscription = await subscriptionRepository.findSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SUBSCRIPTION_NOT_FOUND);
  }
  return subscriptionRepository.deleteSubscription(subscriptionId);
};

export default {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
};