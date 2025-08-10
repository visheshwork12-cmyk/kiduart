import Joi from 'joi';
import { password, objectId } from '@validations/custom.validation.js';

const register = {
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

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

export default {
  register,
  login,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
};