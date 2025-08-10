// src/api/v1/modules/superadmin/role/role.validations.js
import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const createRole = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    permissions: Joi.array().items(Joi.string().valid(...CONSTANTS.PERMISSIONS)).required().min(1),
  }),
};

const bulkCreateRoles = {
  body: Joi.object().keys({
    roles: Joi.array().items(
      Joi.object({
        name: Joi.string().required().trim(),
        permissions: Joi.array().items(Joi.string().valid(...CONSTANTS.PERMISSIONS)).required().min(1),
      })
    ).min(1).required(),
  }),
};

const getRoles = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const getRoleById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const updateRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().trim(),
    permissions: Joi.array().items(Joi.string().valid(...CONSTANTS.PERMISSIONS)).optional().min(1),
  }).min(1),
};

const deleteRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const getRolePermissions = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const purgeCache = {
  query: Joi.object().keys({}),
};

export default {
  createRole,
  bulkCreateRoles,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  purgeCache,
};