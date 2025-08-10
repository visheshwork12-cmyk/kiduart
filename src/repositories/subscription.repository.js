import SubscriptionModel from '@models/superadmin/subscription.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';

const createSubscription = async (subscriptionBody) => {
  return SubscriptionModel.create(subscriptionBody);
};

const findSubscriptionById = async (id) => {
  return SubscriptionModel.findById(id).populate('schoolId', 'name email');
};

const findSubscriptions = async (filter, options) => {
  return SubscriptionModel.paginate(filter, options);
};

const updateSubscription = async (id, updateBody) => {
  const subscription = await SubscriptionModel.findById(id);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  Object.assign(subscription, updateBody);
  await subscription.save();
  return subscription.populate('schoolId', 'name email');
};

const deleteSubscription = async (id) => {
  const subscription = await SubscriptionModel.findById(id);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  await subscription.deleteOne();
};

export default {
  createSubscription,
  findSubscriptionById,
  findSubscriptions,
  updateSubscription,
  deleteSubscription,
};