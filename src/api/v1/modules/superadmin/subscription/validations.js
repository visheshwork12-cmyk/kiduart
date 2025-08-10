import Joi from 'joi';
import { objectId } from '@validations/custom.validation.js';
import CONSTANTS from '@config/constants.js';

const createSubscription = {
  body: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
    plan: Joi.string()
      .valid(...Object.values(CONSTANTS.SUBSCRIPTION_PLANS))
      .required(),
    startDate: Joi.date().required(),
    expiryDate: Joi.date().required(),
    status: Joi.string()
      .valid(...Object.values(CONSTANTS.SUBSCRIPTION_STATUS))
      .default(CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE),
  }),
};

const getSubscriptions = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt:desc'),
  }),
};

const getSubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().custom(objectId).required(),
  }),
};

const updateSubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      schoolId: Joi.string().custom(objectId).optional(),
      plan: Joi.string()
        .valid(...Object.values(CONSTANTS.SUBSCRIPTION_PLANS))
        .optional(),
      startDate: Joi.date().optional(),
      expiryDate: Joi.date().optional(),
      status: Joi.string()
        .valid(...Object.values(CONSTANTS.SUBSCRIPTION_STATUS))
        .optional(),
    })
    .min(1),
};

const deleteSubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().custom(objectId).required(),
  }),
};

export default {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
};