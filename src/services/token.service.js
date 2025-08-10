import jwt from 'jsonwebtoken';
import { addMinutes, addDays, getUnixTime } from 'date-fns';
import httpStatus from 'http-status';
import config from '../config/index.js';
import Token from '../models/shared/token.model.js';
import ApiError from '../shared/utils/apiError.js';
import  tokens  from '../config/tokens.js';

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    type,
    iat: getUnixTime(new Date()),
    exp: getUnixTime(expires),
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires,
    type,
    blacklisted,
  });
  return tokenDoc;
};

const verifyToken = async (token, type) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
      throw new Error('Token not found or blacklisted');
    }
    return tokenDoc;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `Token verification failed: ${error.message}`);
  }
};

const generateAuthTokens = async (admin) => {
  const accessTokenExpires = addMinutes(new Date(), config.jwt.accessExpirationMinutes);
  const accessToken = generateToken(admin._id, accessTokenExpires, tokens.ACCESS);

  const refreshTokenExpires = addDays(new Date(), config.jwt.refreshExpirationDays);
  const refreshToken = generateToken(admin._id, refreshTokenExpires, tokens.REFRESH);
  await saveToken(refreshToken, admin._id, refreshTokenExpires, tokens.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

const generateResetPasswordToken = async (admin) => {
  const expires = addMinutes(new Date(), config.jwt.resetPasswordExpirationMinutes);
  const resetPasswordToken = generateToken(admin._id, expires, tokens.RESET_PASSWORD);
  await saveToken(resetPasswordToken, admin._id, expires, tokens.RESET_PASSWORD);
  return resetPasswordToken;
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
};