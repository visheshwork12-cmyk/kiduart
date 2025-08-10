// src/api/v1/modules/superadmin/featureFlag/featureFlag.validations.js
import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const createFeatureFlag = {
  body: Joi.object().keys({
    name: Joi.string().valid(...CONSTANTS.FEATURE_FLAGS).required(),
    enabled: Joi.boolean().required(),
  }),
};

const bulkCreateFeatureFlags = {
  body: Joi.object().keys({
    flags: Joi.array().items(
      Joi.object({
        name: Joi.string().valid(...CONSTANTS.FEATURE_FLAGS).required(),
        enabled: Joi.boolean().required(),
      })
    ).min(1).required(),
  }),
};

const getFeatureFlags = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const updateFeatureFlag = {
  params: Joi.object().keys({
    name: Joi.string().valid(...CONSTANTS.FEATURE_FLAGS).required(),
  }),
  body: Joi.object().keys({
    enabled: Joi.boolean().required(),
  }),
};

const toggleFeatureFlag = {
  params: Joi.object().keys({
    name: Joi.string().valid(...CONSTANTS.FEATURE_FLAGS).required(),
  }),
};

const deleteFeatureFlag = {
  params: Joi.object().keys({
    name: Joi.string().valid(...CONSTANTS.FEATURE_FLAGS).required(),
  }),
};

const purgeCache = {
  query: Joi.object().keys({}),
};

export default {
  createFeatureFlag,
  bulkCreateFeatureFlags,
  getFeatureFlags,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
  purgeCache,
};