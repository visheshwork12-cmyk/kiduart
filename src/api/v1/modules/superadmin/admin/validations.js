import Joi from 'joi';
import { password, objectId } from '@validations/custom.validation.js';

const createAdmin = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().valid('superadmin', 'admin').default('admin'),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    zipcode: Joi.string().optional(),
  }),
};

const getAdmins = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt:desc'),
  }),
};

const getAdmin = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId).required(),
  }),
};

const updateAdmin = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().optional(),
    name: Joi.string().optional(),
    role: Joi.string().valid('superadmin', 'admin').optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    zipcode: Joi.string().optional(),
  }).min(1),
};

const deleteAdmin = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId).required(),
  }),
};

export default {
  createAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
};